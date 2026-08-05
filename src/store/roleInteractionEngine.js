import builtinRules from "./roleInteractionRules.json";
import {
  FACT_TYPES,
  makeBattleLogReminder,
  resolvePlayerIndex,
  reminderFactTypeForAdd,
  reminderFactTypeForRemove,
} from "./battleLogEffects";
import { formatPlayerRoleLabel } from "./roleInputConfig";
import {
  isPlayerInputType,
  resolveEffectEnabled,
  formatGrimoireEffectSpec,
} from "./roleInteractionTypes";
import { makeRoleReminder } from "./roleReminderCatalog";

const STORAGE_KEY = "roleInteractionRulesOverlay";

/** @returns {Map<string, object>} */
export function getBuiltinRulesMap() {
  const map = new Map();
  (builtinRules.rules || []).forEach((rule) => {
    if (rule && rule.id) map.set(rule.id.toLowerCase(), normalizeRule(rule));
  });
  return map;
}

export function normalizeRule(rule) {
  if (!rule) return null;
  return {
    id: rule.id,
    name: rule.name || rule.id,
    enabled: rule.enabled !== false,
    activation: rule.activation || null,
    once: !!rule.once,
    when: rule.when || null,
    inputs: Array.isArray(rule.inputs) ? rule.inputs.slice() : [],
    sentence: rule.sentence || { action: "選擇", template: "{actor} → {action}" },
    effects: Array.isArray(rule.effects) ? rule.effects.slice() : [],
    notes: rule.notes || "",
  };
}

export function loadOverlayFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch (e) {
    console.warn("roleInteractionRules overlay load failed", e);
    return {};
  }
}

export function saveOverlayToStorage(overlay) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

export function clearOverlayStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Merge builtin + overlay; overlay wins per role id */
export function mergeRules(overlay = {}) {
  const merged = getBuiltinRulesMap();
  Object.keys(overlay).forEach((id) => {
    const rule = overlay[id];
    if (rule === null) {
      merged.delete(id.toLowerCase());
      return;
    }
    if (rule && rule.id) {
      merged.set(id.toLowerCase(), normalizeRule(rule));
    }
  });
  return merged;
}

export function getRule(roleId, overlay = {}) {
  if (!roleId) return null;
  const merged = mergeRules(overlay);
  return merged.get(String(roleId).toLowerCase()) || null;
}

export function isOptionalActivation(rule) {
  if (!rule || rule.enabled === false) return false;
  return (
    rule.activation === "optional" ||
    rule.activation === "setup" ||
    rule.activation === "trigger"
  );
}

export function ruleAppliesTonight(rule, isFirstNight) {
  if (!rule || !rule.enabled) return false;
  // setup / optional / trigger pool — not auto-listed in night order
  if (isOptionalActivation(rule)) {
    return false;
  }
  const nights = rule.when && rule.when.nights;
  if (!nights || !nights.length) return true;
  return nights.includes(isFirstNight ? "first" : "other");
}

/** Extra setup-only configs (night rule may coexist on same role). */
const SETUP_RULES = {
  fortuneteller: {
    name: "占卜師",
    once: true,
    inputs: [{ key: "p1", type: "player", label: "視為惡魔" }],
    sentence: {
      action: "始終將",
      template: "{actor}始終將 {p1} 視為惡魔",
    },
    effects: [],
    notes: "開局選定一名善良玩家「視為惡魔」（整局）",
  },
};

export function getSetupRule(roleId, overlay = {}) {
  if (!roleId) return null;
  const id = String(roleId).toLowerCase();
  const base = getRule(id, overlay);
  if (base && base.enabled && base.activation === "setup") {
    return base;
  }
  const extra = SETUP_RULES[id];
  if (!extra) return null;
  return normalizeRule({
    id,
    name: (base && base.name) || extra.name || id,
    enabled: true,
    activation: "setup",
    when: { nights: [] },
    ...extra,
  });
}

export function roleHasSetupAction(role, overlay = {}) {
  if (!role || !role.id) return false;
  return !!getSetupRule(role.id, overlay);
}

export function setupTaskNote(role, overlay = {}) {
  const setupRule = getSetupRule(role.id, overlay);
  if (setupRule && setupRule.notes) return setupRule.notes;
  if (role && role.setup) return "開局設置（詳見角色能力）";
  return "";
}

export function buildSetupRoleCardKey(phaseId, playerIndex, roleId) {
  return `setup|${phaseId}|${playerIndex}|${roleId || ""}`;
}

export function parseSetupRoleCardKey(roleCardKey) {
  if (!roleCardKey || !String(roleCardKey).startsWith("setup|")) return null;
  const parts = String(roleCardKey).split("|");
  if (parts.length < 4) return null;
  const playerIndex = parseInt(parts[parts.length - 2], 10);
  const roleId = parts[parts.length - 1];
  const phaseId = parts.slice(1, parts.length - 2).join("|");
  if (Number.isNaN(playerIndex)) return null;
  return { phaseId, playerIndex, roleId, setup: true };
}

export const DISGUISE_SETUP_ROLE_IDS = new Set(["drunk", "marionette"]);

export function disguiseIdentityReminderName(setupRoleId) {
  const id = String(setupRoleId || "").toLowerCase();
  if (id === "marionette") return "是提線木偶";
  if (id === "drunk") return "是酒鬼";
  return "";
}

export function hasDisguiseRoleAssigned(players, setupRoleId) {
  const id = String(setupRoleId || "").toLowerCase();
  return (players || []).some(
    (p) =>
      p &&
      p.role &&
      String(p.role.id || "").toLowerCase() === id,
  );
}

export function hasDisguiseIdentityMarker(players, setupRoleId) {
  const name = disguiseIdentityReminderName(setupRoleId);
  if (!name) return false;
  return (players || []).some((p) =>
    (p && p.reminders ? p.reminders : []).some(
      (r) => r && r.name === name,
    ),
  );
}

/** disguise = 已指派身份字卡；markOnly = 僅掛身份標記於善良玩家 */
export function resolveDisguiseSetupVariant(
  players,
  setupRoleId,
  playerIndex = -1,
) {
  const id = String(setupRoleId || "").toLowerCase();
  if (!DISGUISE_SETUP_ROLE_IDS.has(id)) return null;
  if (
    playerIndex >= 0 &&
    players[playerIndex] &&
    players[playerIndex].role &&
    String(players[playerIndex].role.id || "").toLowerCase() === id
  ) {
    return "disguise";
  }
  return "markOnly";
}

export function shouldShowMarkOnlyDisguiseSetup(players, setupRoleId) {
  const id = String(setupRoleId || "").toLowerCase();
  if (!DISGUISE_SETUP_ROLE_IDS.has(id)) return false;
  if (hasDisguiseRoleAssigned(players, id)) return false;
  if (hasDisguiseIdentityMarker(players, id)) return false;
  return true;
}

function inferDisguiseSetupVariantFromForm(rule, formData) {
  if (!rule || rule.activation !== "setup") return null;
  const id = String(rule.id || "").toLowerCase();
  if (!DISGUISE_SETUP_ROLE_IDS.has(id)) return null;
  const fd = formData || {};
  if (fd.r1 != null && String(fd.r1).trim() !== "") return "disguise";
  if (fd.p1 != null && String(fd.p1).trim() !== "") return "markOnly";
  return null;
}

export function roleHasOptionalAction(role, overlay = {}) {
  if (!role || !role.id) return false;
  const rule = getRule(role.id, overlay);
  if (!rule || rule.enabled === false) return false;
  return (
    rule.activation === "optional" ||
    rule.activation === "trigger"
  );
}

/** Optional record picker: trigger/once + setup roles. */
export function roleHasActivatableRecord(role, overlay = {}) {
  if (!role || !role.id) return false;
  return (
    roleHasOptionalAction(role, overlay) ||
    roleHasSetupAction(role, overlay)
  );
}

export function inputsFromRule(rule) {
  if (!rule || !rule.enabled) return [];
  return (rule.inputs || []).map((input) => ({ ...input }));
}

export function buildSentence(rule, ctx) {
  if (!rule || !rule.sentence) return "";
  const { template, action: sentenceAction } = rule.sentence;
  const formData = (ctx && ctx.formData) || {};
  const actor =
    (ctx && ctx.actor) ||
    (ctx && ctx.roleName) ||
    rule.name ||
    rule.id;
  const action = sentenceAction || "選擇";

  let result = template || "{actor} → {action}";
  result = result.replace(/\{actor\}/g, actor);
  result = result.replace(/\{action\}/g, action);

  const keys = new Set([
    ...Object.keys(formData),
    ...(rule.inputs || []).map((i) => i.key),
  ]);
  keys.forEach((key) => {
    const val = formData[key];
    const replacement =
      val != null && String(val).trim() !== "" ? String(val) : `{${key}}`;
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), replacement);
  });

  return result;
}

function resolveRoleFromForm(rolesMap, nameOrId) {
  if (!rolesMap || !nameOrId) return null;
  const q = String(nameOrId).trim();
  if (!q) return null;
  if (typeof rolesMap.get === "function") {
    const byId = rolesMap.get(q.toLowerCase());
    if (byId) return byId;
    for (const role of rolesMap.values()) {
      if (role && (role.name === q || role.id === q)) return role;
    }
  } else if (Array.isArray(rolesMap)) {
    return (
      rolesMap.find(
        (r) => r && (r.name === q || String(r.id).toLowerCase() === q.toLowerCase()),
      ) || null
    );
  }
  return null;
}

function resolveEffectTargetIndex(targetFrom, formData, players, actorIndex = -1) {
  if (!targetFrom) return -1;
  if (targetFrom === "actor" || targetFrom === "__actor__") {
    return actorIndex >= 0 ? actorIndex : -1;
  }
  if (!formData) return -1;
  const label = formData[targetFrom];
  if (!label) return -1;
  return resolvePlayerIndex(players, label);
}

export function effectsFromRule(
  rule,
  formData,
  players,
  effectToggles = {},
  rolesMap = null,
  actorIndex = -1,
  options = {},
) {
  if (!rule || !rule.effects || !rule.effects.length) return [];
  const effects = [];
  const setupVariant =
    options.setupVariant ||
    (options.formSnapshot && options.formSnapshot.setupVariant) ||
    inferDisguiseSetupVariantFromForm(rule, formData);

  rule.effects.forEach((spec, idx) => {
    const enabled = resolveEffectEnabled(spec, idx, rule, effectToggles);
    if (!enabled) return;

    if (setupVariant === "markOnly" && spec.type !== "addReminder") return;
    if (setupVariant === "disguise" && spec.type === "setDisguiseRole") return;

    const playerIndex = resolveEffectTargetIndex(
      spec.targetFrom,
      formData,
      players,
      actorIndex,
    );
    const needsPlayer =
      spec.targetFrom &&
      spec.targetFrom !== "actor" &&
      spec.targetFrom !== "__actor__";
    if (playerIndex < 0 && needsPlayer) return;

    switch (spec.type) {
      case "setDead":
        effects.push({
          type: "setDead",
          playerIndex,
          value: spec.value !== false,
        });
        break;
      case "setRevive":
        effects.push({ type: "setRevive", playerIndex });
        break;
      case "setAbilityLost":
        effects.push({
          type: "setAbilityLost",
          playerIndex,
          value: spec.value !== false,
        });
        break;
      case "setRole": {
        let roleObj = null;
        if (spec.roleId) {
          roleObj = resolveRoleFromForm(rolesMap, spec.roleId);
        } else {
          const roleFrom = spec.roleFrom || "r1";
          roleObj = resolveRoleFromForm(rolesMap, formData[roleFrom]);
        }
        const pi = resolveEffectTargetIndex(
          spec.targetFrom || "actor",
          formData,
          players,
          actorIndex,
        );
        if (pi < 0 || !roleObj) break;
        const previousRole =
          players[pi] && players[pi].role ? { ...players[pi].role } : null;
        if (
          spec.skipIfAlready &&
          previousRole &&
          String(previousRole.id || "").toLowerCase() ===
            String(roleObj.id || "").toLowerCase()
        ) {
          break;
        }
        effects.push({
          type: "setRole",
          playerIndex: pi,
          role: { ...roleObj },
          previousRole,
        });
        break;
      }
      case "setDisguiseRole": {
        const roleFrom = spec.roleFrom || "r1";
        const roleObj = resolveRoleFromForm(rolesMap, formData[roleFrom]);
        const pi = resolveEffectTargetIndex(
          spec.targetFrom || "actor",
          formData,
          players,
          actorIndex,
        );
        if (pi < 0 || !roleObj) break;
        const previousDisguise =
          players[pi] && players[pi].disguiseRole
            ? { ...players[pi].disguiseRole }
            : null;
        effects.push({
          type: "setDisguiseRole",
          playerIndex: pi,
          role: { ...roleObj },
          previousRole: previousDisguise,
        });
        break;
      }
      case "addReminder": {
        const reminder = makeRoleReminder(
          spec.reminderName || "提醒",
          spec.reminderRole || rule.id || "battleLog",
          rolesMap,
        );
        const factType =
          reminderFactTypeForAdd(reminder) ||
          (spec.reminderName === "中毒"
            ? FACT_TYPES.EVENT_POISON
            : null);
        effects.push({
          type: "addReminder",
          playerIndex,
          reminder,
          factType,
          unique: !!spec.unique,
        });
        break;
      }
      case "removeReminder": {
        const reminder = makeRoleReminder(
          spec.reminderName || "提醒",
          spec.reminderRole || rule.id || "battleLog",
          rolesMap,
        );
        effects.push({
          type: "removeReminder",
          playerIndex,
          reminder,
          factType: reminderFactTypeForRemove(reminder),
        });
        break;
      }
      default:
        break;
    }
  });

  return effects;
}

export function describeEffects(effects, players) {
  return (effects || []).map((e) => {
    const label =
      e.playerIndex >= 0 && players[e.playerIndex]
        ? formatPlayerRoleLabel(players[e.playerIndex], e.playerIndex)
        : `座位 ${(e.playerIndex || 0) + 1}`;
    switch (e.type) {
      case "setDead":
        return e.value ? `${label} 死亡` : `${label} 復活`;
      case "setRevive":
        return `${label} 復活`;
      case "setAbilityLost":
        return `${label} 失去能力`;
      case "addReminder":
        return `${label} 加上「${(e.reminder && e.reminder.name) || "提醒"}」`;
      case "setRole":
        return `${label} 角色改為「${(e.role && e.role.name) || "?"}」`;
      case "setDisguiseRole":
        return `${label} 表面角色改為「${(e.role && e.role.name) || "?"}」`;
      case "removeReminder":
        return `${label} 移除「${(e.reminder && e.reminder.name) || "提醒"}」`;
      default:
        return `${e.type} → ${label}`;
    }
  });
}

export function draftFromInputConfig(role, inputs) {
  if (!role || !inputs || !inputs.length) return null;
  const playerKeys = inputs
    .filter((i) => isPlayerInputType(i.type))
    .map((i) => i.key);
  const primaryTarget = playerKeys[0] || "target";
  const parts = inputs.map((i) => `{${i.key}}`);
  return normalizeRule({
    id: role.id,
    name: role.name || role.id,
    enabled: true,
    inputs: inputs.map((i) => ({
      key: i.key,
      type: i.type,
      label: i.label,
      options: i.options,
      required: false,
    })),
    sentence: {
      action: "選擇",
      template: `{actor} → {action} → ${parts.join(" / ")}`,
    },
    effects: [],
    notes: "draft-from-roleInputConfig",
  });
}

export function exportRulesBundle(overlay) {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      overlay: overlay || {},
    },
    null,
    2,
  );
}

export function parseRulesImport(text) {
  const parsed = JSON.parse(text);
  if (parsed.overlay && typeof parsed.overlay === "object") {
    return parsed.overlay;
  }
  if (parsed.rules && Array.isArray(parsed.rules)) {
    const overlay = {};
    parsed.rules.forEach((rule) => {
      if (rule && rule.id) overlay[rule.id.toLowerCase()] = normalizeRule(rule);
    });
    return overlay;
  }
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  throw new Error("invalid format");
}

export function coverageStatus(role, overlay, getRoleInputConfigFn) {
  const id = (role.id || "").toLowerCase();
  const rule = getRule(id, overlay);
  if (rule && rule.enabled) {
    if (rule.effects && rule.effects.length) return "complete";
    if (rule.inputs && rule.inputs.length) return "inputs-only";
    return "passive";
  }
  const legacyInputs = getRoleInputConfigFn(role);
  if (legacyInputs && legacyInputs.length) return "draft-available";
  return "fallback";
}
