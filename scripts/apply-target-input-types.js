/**
 * Batch-set player input types on roleInteractionRules.json.
 *
 * Priority:
 *   1) Explicit type from docs/official-skill-cards-*.md 「輸入」 when key matches
 *   2) Ability-text heuristics (roles.json / roles.zh_TW.json)
 *   3) Kill/poison effects on the same card → alivePlayer for that target
 *   4) Keep existing type
 *
 * Usage:
 *   node scripts/apply-target-input-types.js           # write
 *   node scripts/apply-target-input-types.js --dry-run # report only
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RULES_PATH = path.join(ROOT, "src", "store", "roleInteractionRules.json");
const ROLES_PATH = path.join(ROOT, "src", "roles.json");
const ROLES_TW_PATH = path.join(ROOT, "src", "roles.zh_TW.json");
const SKILL_DOCS = ["tb", "bmr", "snv"].map((ed) =>
  path.join(ROOT, "docs", `official-skill-cards-${ed}.md`),
);

const PLAYER_TYPES = new Set(["player", "alivePlayer", "otherPlayer"]);
const DRY_RUN = process.argv.includes("--dry-run");

/** Roles that must stay `player` (may target dead / self; no alive-only filter). */
const FORCE_ALL_PLAYERS = new Set(["poisoner", "imp"]);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadRolesMap() {
  const map = new Map();
  for (const file of [ROLES_PATH, ROLES_TW_PATH]) {
    if (!fs.existsSync(file)) continue;
    const list = loadJson(file);
    (Array.isArray(list) ? list : []).forEach((r) => {
      if (!r || !r.id) return;
      const id = String(r.id).toLowerCase();
      const prev = map.get(id) || {};
      map.set(id, {
        ...prev,
        ...r,
        ability: r.ability || prev.ability || "",
      });
    });
  }
  return map;
}

/** Parse `- 輸入: type:key(label), ...` from skill-card markdown. */
function parseSkillCardInputs(md) {
  const byRole = new Map();
  const parts = md.split(/^### /m).slice(1);
  for (const part of parts) {
    const head = part.match(/^([a-z0-9]+)\s*\|\s*([^\n]+)/i);
    if (!head) continue;
    const id = head[1].toLowerCase();
    const m = part.match(/^- 輸入:\s*(.+)$/m);
    if (!m) continue;
    const raw = m[1].trim();
    if (!raw || raw === "(無)") continue;
    const inputs = new Map();
    raw.split(",").forEach((chunk) => {
      const s = chunk.trim();
      const hit = s.match(
        /^(player|alivePlayer|otherPlayer|role|select|number|text):([a-zA-Z0-9_]+)/,
      );
      if (!hit) return;
      if (!PLAYER_TYPES.has(hit[1])) return;
      inputs.set(hit[2], hit[1]);
    });
    if (inputs.size) {
      const existing = byRole.get(id) || new Map();
      inputs.forEach((type, key) => existing.set(key, type));
      byRole.set(id, existing);
    }
  }
  return byRole;
}

function loadSkillInputs() {
  const merged = new Map();
  for (const doc of SKILL_DOCS) {
    if (!fs.existsSync(doc)) continue;
    const parsed = parseSkillCardInputs(fs.readFileSync(doc, "utf8"));
    parsed.forEach((inputs, id) => {
      const dest = merged.get(id) || new Map();
      inputs.forEach((type, key) => dest.set(key, type));
      merged.set(id, dest);
    });
  }
  return merged;
}

function abilitySuggestsOther(ability) {
  return /除你以外|其他玩家|除了你|除自身外/.test(ability || "");
}

function abilitySuggestsAlive(ability) {
  // Selection of a living player — not mere "when N alive" win conditions.
  if (!ability) return false;
  if (
    /選擇[^。；]*存活|一名存活|存活的玩家|存活玩家|選擇一名存活|選中[^。；]*存活/.test(
      ability,
    )
  ) {
    return true;
  }
  // Night kill / poison phrasing often implies living target without 存活字樣
  if (/你要選擇一名玩家：.*(?:死亡|中毒)/.test(ability)) return true;
  if (/每個夜晚\*?，你要選擇一名玩家：.*(?:他死亡|會死亡)/.test(ability)) {
    return true;
  }
  return false;
}

function cardHasKillOrPoison(card) {
  const effects = (card && card.effects) || [];
  return effects.some((e) => {
    if (!e) return false;
    if (e.type === "setDead" && e.value !== false) return true;
    if (
      e.type === "addReminder" &&
      (e.reminderName === "中毒" || e.reminderName === "死亡")
    ) {
      return true;
    }
    return false;
  });
}

function effectTargetKeys(card) {
  const keys = new Set();
  ((card && card.effects) || []).forEach((e) => {
    if (!e || !e.targetFrom) return;
    if (e.targetFrom === "actor" || e.targetFrom === "__actor__") return;
    if (
      e.type === "setDead" ||
      (e.type === "addReminder" &&
        (e.reminderName === "中毒" || e.reminderName === "死亡"))
    ) {
      keys.add(e.targetFrom);
    }
  });
  return keys;
}

/**
 * @returns {{ type: string, reason: string } | null} null = keep current
 */
function decideType(roleId, card, input, ability, skillInputs) {
  if (!input || !PLAYER_TYPES.has(input.type)) return null;
  const key = input.key;
  const current = input.type;

  // Explicit allow-all: never upgrade to alivePlayer/otherPlayer via heuristics
  if (FORCE_ALL_PLAYERS.has(roleId)) {
    if (current !== "player") {
      return { type: "player", reason: "force-all-players" };
    }
    return null;
  }

  // 1) Skill-card explicit (auxiliary — only upgrade, never block ability heuristics)
  const skillType =
    skillInputs && skillInputs.get(roleId) && skillInputs.get(roleId).get(key);
  if (skillType && PLAYER_TYPES.has(skillType) && skillType !== "player") {
    const specificity = { player: 0, alivePlayer: 1, otherPlayer: 1 };
    const curRank = specificity[current] || 0;
    const skillRank = specificity[skillType] || 0;
    if (skillRank >= curRank && skillType !== current) {
      return { type: skillType, reason: "skill-card" };
    }
    if (skillType === current) return null;
  }

  // 2) Ability: otherPlayer beats alive when both apply
  if (abilitySuggestsOther(ability)) {
    if (current !== "otherPlayer") {
      return { type: "otherPlayer", reason: "ability-other" };
    }
    return null;
  }

  if (abilitySuggestsAlive(ability)) {
    if (current !== "alivePlayer") {
      return { type: "alivePlayer", reason: "ability-alive" };
    }
    return null;
  }

  // 3) Card effects kill/poison on this input key
  const killKeys = effectTargetKeys(card);
  if (killKeys.has(key) || (cardHasKillOrPoison(card) && key === "target")) {
    if (current !== "alivePlayer" && current !== "otherPlayer") {
      return { type: "alivePlayer", reason: "effect-kill" };
    }
  }

  return null;
}

function main() {
  const doc = loadJson(RULES_PATH);
  const rolesMap = loadRolesMap();
  const skillInputs = loadSkillInputs();
  const changes = [];

  (doc.rules || []).forEach((rule) => {
    if (!rule || !rule.id) return;
    const roleId = String(rule.id).toLowerCase();
    const role = rolesMap.get(roleId) || {};
    const ability = role.ability || "";

    (rule.cards || []).forEach((card) => {
      if (!card || !Array.isArray(card.inputs)) return;
      card.inputs.forEach((input) => {
        if (!PLAYER_TYPES.has(input.type)) return;
        const decided = decideType(
          roleId,
          card,
          input,
          ability,
          skillInputs,
        );
        if (!decided) return;
        changes.push({
          roleId,
          name: rule.name || roleId,
          cardKey: card.key || "",
          inputKey: input.key,
          from: input.type,
          to: decided.type,
          reason: decided.reason,
        });
        if (!DRY_RUN) {
          input.type = decided.type;
        }
      });
    });
  });

  // Summary
  console.log(
    DRY_RUN
      ? `Dry-run: ${changes.length} change(s)`
      : `Applied: ${changes.length} change(s)`,
  );
  const byReason = {};
  changes.forEach((c) => {
    byReason[c.reason] = (byReason[c.reason] || 0) + 1;
    console.log(
      `  ${c.roleId}/${c.cardKey} ${c.inputKey}: ${c.from} → ${c.to} (${c.reason})`,
    );
  });
  console.log("By reason:", byReason);

  if (!DRY_RUN) {
    fs.writeFileSync(RULES_PATH, JSON.stringify(doc, null, 2) + "\n", "utf8");
    console.log(`Wrote ${RULES_PATH}`);
  }
}

main();
