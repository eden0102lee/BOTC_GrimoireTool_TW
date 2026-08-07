/**
 * Shared input / status types for interaction rules and log cards.
 */
import { reminderNamesForRole } from "./roleReminderCatalog";
import {
  ALIGNMENT_LABELS,
  TEAM_LABELS,
  alignmentLabel,
  normalizeAlignment,
  resolvePlayerAlignment,
} from "./teamTerms";

export const PLAYER_INPUT_TYPES = ["player", "alivePlayer", "otherPlayer"];

export const INPUT_TYPE_LABELS = {
  player: "全部玩家",
  alivePlayer: "存活玩家",
  otherPlayer: "其他玩家",
  role: "角色",
  select: "選項",
  number: "數字",
  text: "文字",
};

export { ALIGNMENT_LABELS, TEAM_LABELS };

/** Status labels applied via manual tokens or rule effects */
export const MANUAL_STATUSES = [
  "死亡",
  "中毒",
  "醉酒",
  "瘋狂",
  "復活",
  "失去能力",
];

export const REMINDER_PRESETS = [
  "死亡",
  "帷幕",
  "中毒",
  "醉酒",
  "瘋狂",
  "保護",
  "鎮民",
  "非鎮民",
];

/** Grimoire board actions shown in the rules editor */
export const GRIMOIRE_ACTION_TYPES = [
  { type: "setDead", label: "設為死亡（帷幕）", needsReminder: false },
  { type: "setRevive", label: "復活（移除帷幕）", needsReminder: false },
  { type: "setAbilityLost", label: "失去能力", needsReminder: false },
  { type: "setAlignment", label: "設定陣營", needsReminder: false },
  { type: "addReminder", label: "掛上標記", needsReminder: true },
  { type: "removeReminder", label: "移除標記", needsReminder: true },
];

export function grimoireActionLabel(type) {
  const found = GRIMOIRE_ACTION_TYPES.find((a) => a.type === type);
  return found ? found.label : type;
}

export function grimoireActionNeedsReminder(type) {
  const found = GRIMOIRE_ACTION_TYPES.find((a) => a.type === type);
  return found ? found.needsReminder : false;
}

function normalizeInputSpec(inputOrType) {
  if (!inputOrType) return { type: "player" };
  if (typeof inputOrType === "string") return { type: inputOrType };
  return inputOrType;
}

function teamsFilterList(input) {
  const raw = input && input.teams;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t || "").toLowerCase()).filter(Boolean);
  }
  return String(raw)
    .split(/[,，\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {Array} players
 * @param {string|object} inputOrType — type string or full input spec
 * @param {number} actorIndex seat index to exclude for otherPlayer (-1 = no exclusion)
 * @param {(player: object, index: number) => string} labelFn
 */
export function filterPlayersForInput(
  players,
  inputOrType,
  actorIndex,
  labelFn,
) {
  const input = normalizeInputSpec(inputOrType);
  const type = input.type || "player";
  const alignment = normalizeAlignment(input.alignment);
  const teams = teamsFilterList(input);
  const out = [];
  (players || []).forEach((p, i) => {
    if (type === "alivePlayer" && p && p.isDead) return;
    if (
      type === "otherPlayer" &&
      actorIndex != null &&
      actorIndex >= 0 &&
      i === actorIndex
    ) {
      return;
    }
    if (alignment) {
      if (resolvePlayerAlignment(p) !== alignment) return;
    }
    if (teams.length) {
      const team = p && p.role && p.role.team
        ? String(p.role.team).toLowerCase()
        : "";
      if (!team || !teams.includes(team)) return;
    }
    out.push({
      player: p,
      index: i,
      label: labelFn(p, i),
    });
  });
  return out;
}

/**
 * Filter role catalogue options for a role input.
 * @param {Array} roles
 * @param {Array} players — used when inPlay is true
 * @param {object} input — role input spec
 */
export function filterRolesForInput(roles, players, input) {
  const spec = normalizeInputSpec(input);
  const teams = teamsFilterList(spec);
  let list = (roles || []).filter((r) => r && r.id);

  if (spec.inPlay) {
    const ids = new Set();
    (players || []).forEach((p) => {
      if (p && p.role && p.role.id) ids.add(String(p.role.id).toLowerCase());
      if (p && p.disguiseRole && p.disguiseRole.id) {
        ids.add(String(p.disguiseRole.id).toLowerCase());
      }
    });
    list = list.filter((r) => ids.has(String(r.id).toLowerCase()));
  }

  if (teams.length) {
    list = list.filter(
      (r) => r.team && teams.includes(String(r.team).toLowerCase()),
    );
  }

  const exclude = (spec.excludeIds || []).map((id) =>
    String(id || "").toLowerCase(),
  );
  if (exclude.length) {
    list = list.filter((r) => !exclude.includes(String(r.id).toLowerCase()));
  }

  return list;
}

/** Human-readable one-line summary for an effect spec */
export function formatGrimoireEffectSpec(spec, inputs = []) {
  if (!spec) return "";
  const input = (inputs || []).find((i) => i.key === spec.targetFrom);
  const targetLabel =
    spec.targetFrom === "actor" || spec.targetFrom === "__actor__"
      ? "自身"
      : (input && input.label) || spec.targetFrom || "對象";
  const action = grimoireActionLabel(spec.type);
  if (grimoireActionNeedsReminder(spec.type)) {
    const token = spec.reminderName || "標記";
    return `${targetLabel} ${action}「${token}」`;
  }
  if (spec.type === "setAlignment") {
    if (spec.alignmentFrom) {
      const fromInput = (inputs || []).find((i) => i.key === spec.alignmentFrom);
      const fromLabel =
        spec.alignmentFrom === "actor"
          ? "自身"
          : (fromInput && fromInput.label) || spec.alignmentFrom;
      return `${targetLabel} 轉為「${fromLabel}」的陣營`;
    }
    const a = alignmentLabel(spec.alignment) || spec.alignment || "?";
    return `${targetLabel} 陣營設為「${a}」`;
  }
  return `${targetLabel} ${action}`;
}

export function collectReminderNamesForRole(role, rolesMap = null) {
  if (rolesMap && role && role.id) {
    return reminderNamesForRole(role.id, rolesMap, { includeGeneric: true });
  }
  const names = new Set(REMINDER_PRESETS);
  if (!role) return [...names];
  (role.reminders || []).forEach((n) => names.add(n));
  (role.remindersGlobal || []).forEach((n) => names.add(n));
  return [...names];
}

export function isEffectToggleVisible(spec) {
  return spec && spec.optional && !spec.bindTo;
}

export function resolveEffectEnabled(spec, idx, rule, effectToggles) {
  if (spec.bindTo) {
    const effects = (rule && rule.effects) || [];
    const leaderIdx = effects.findIndex(
      (e) => e.id === spec.bindTo || e.id === spec.bindTo.replace(/^effect-/, ""),
    );
    const leader =
      leaderIdx >= 0
        ? effects[leaderIdx]
        : effects.find((e, i) => (e.id || `effect-${i}`) === spec.bindTo);
    const leaderIndex =
      leaderIdx >= 0
        ? leaderIdx
        : effects.findIndex((e, i) => (e.id || `effect-${i}`) === spec.bindTo);
    if (leader && leaderIndex >= 0) {
      return resolveEffectEnabled(leader, leaderIndex, rule, effectToggles);
    }
    const toggle = effectToggles[spec.bindTo];
    return toggle !== undefined ? !!toggle : true;
  }
  if (spec.optional !== true) return true;
  const key = spec.id || `effect-${idx}`;
  if (effectToggles[key] !== undefined) return !!effectToggles[key];
  return spec.defaultOn !== false;
}

export function isPlayerInputType(type) {
  return PLAYER_INPUT_TYPES.includes(type);
}

/** Token types that resolve to a player label in manual cards */
export function isPlayerTokenType(type) {
  return isPlayerInputType(type) || type === "player";
}
