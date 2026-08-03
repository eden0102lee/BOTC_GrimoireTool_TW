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
    when: rule.when || null,
    inputs: Array.isArray(rule.inputs) ? rule.inputs.slice() : [],
    sentence: rule.sentence || { action: "使用能力", template: "{actor} → {action}" },
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

export function ruleAppliesTonight(rule, isFirstNight) {
  if (!rule || !rule.enabled) return false;
  const nights = rule.when && rule.when.nights;
  if (!nights || !nights.length) return true;
  return nights.includes(isFirstNight ? "first" : "other");
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
  const action = sentenceAction || "使用能力";

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

function resolveEffectTargetIndex(targetFrom, formData, players) {
  if (!targetFrom || !formData) return -1;
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
) {
  if (!rule || !rule.effects || !rule.effects.length) return [];
  const effects = [];

  rule.effects.forEach((spec, idx) => {
    const enabled = resolveEffectEnabled(spec, idx, rule, effectToggles);
    if (!enabled) return;

    const playerIndex = resolveEffectTargetIndex(
      spec.targetFrom,
      formData,
      players,
    );
    if (playerIndex < 0 && spec.targetFrom) return;

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
      action: "使用能力",
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
