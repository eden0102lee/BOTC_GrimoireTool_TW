/**
 * Shared input / status types for interaction rules and log cards.
 */
import { reminderNamesForRole } from "./roleReminderCatalog";

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

/** Human-readable one-line summary for an effect spec */
export function formatGrimoireEffectSpec(spec, inputs = []) {
  if (!spec) return "";
  const input = (inputs || []).find((i) => i.key === spec.targetFrom);
  const targetLabel = (input && input.label) || spec.targetFrom || "對象";
  const action = grimoireActionLabel(spec.type);
  if (grimoireActionNeedsReminder(spec.type)) {
    const token = spec.reminderName || "標記";
    return `${targetLabel} ${action}「${token}」`;
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

/**
 * @param {Array} players
 * @param {string} inputType
 * @param {number} actorIndex seat index to exclude for otherPlayer (-1 = no exclusion)
 * @param {(player: object, index: number) => string} labelFn
 */
export function filterPlayersForInput(
  players,
  inputType,
  actorIndex,
  labelFn,
) {
  const type = inputType || "player";
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
    out.push({
      player: p,
      index: i,
      label: labelFn(p, i),
    });
  });
  return out;
}

/** Token types that resolve to a player label in manual cards */
export function isPlayerTokenType(type) {
  return isPlayerInputType(type) || type === "player";
}
