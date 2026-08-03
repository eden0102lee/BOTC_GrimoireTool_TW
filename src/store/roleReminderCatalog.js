/**
 * Role reminder tokens — sourced from community spreadsheet → roles.zh_TW.json
 * @see COMMUNITY_TRANSLATIONS_SHEET_URL
 */
import { makeBattleLogReminder } from "./battleLogEffects";

/** Community BOTC Translations (TW) — reminders column */
export const COMMUNITY_TRANSLATIONS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985";

export const GENERIC_REMINDER_ROLE = "battleLog";

const GENERIC_MARKER_NAMES = [
  "死亡",
  "中毒",
  "醉酒",
  "瘋狂",
  "復活",
  "失去能力",
  "帷幕",
  "保護",
];

function roleFromMap(rolesMap, roleId) {
  if (!rolesMap || !roleId) return null;
  if (typeof rolesMap.get === "function") return rolesMap.get(roleId) || null;
  if (Array.isArray(rolesMap)) {
    return rolesMap.find((r) => r && r.id === roleId) || null;
  }
  return null;
}

/** All reminder token names defined on a role (spreadsheet reminders / remindersGlobal). */
export function reminderNamesForRole(roleId, rolesMap, { includeGeneric = false } = {}) {
  const names = [];
  if (roleId && roleId !== GENERIC_REMINDER_ROLE) {
    const role = roleFromMap(rolesMap, roleId);
    if (role) {
      (role.reminders || []).forEach((n) => names.push(n));
      (role.remindersGlobal || []).forEach((n) => names.push(n));
    }
  }
  if (includeGeneric || roleId === GENERIC_REMINDER_ROLE) {
    GENERIC_MARKER_NAMES.forEach((n) => names.push(n));
  }
  return [...new Set(names.filter(Boolean))];
}

/** Roles that define at least one reminder token. */
export function rolesWithReminders(rolesMap) {
  const list = [];
  const push = (role) => {
    if (!role || !role.id) return;
    const count =
      (role.reminders ? role.reminders.length : 0) +
      (role.remindersGlobal ? role.remindersGlobal.length : 0);
    if (!count) return;
    list.push({
      id: role.id,
      name: role.name || role.id,
      reminders: [
        ...(role.reminders || []),
        ...(role.remindersGlobal || []),
      ],
    });
  };
  if (rolesMap && typeof rolesMap.forEach === "function") {
    rolesMap.forEach(push);
  } else if (Array.isArray(rolesMap)) {
    rolesMap.forEach(push);
  }
  return list.sort((a, b) =>
    (a.name || a.id).localeCompare(b.name || b.id, "zh"),
  );
}

/** Build a board reminder object using role icon metadata when available. */
export function makeRoleReminder(name, roleId, rolesMap) {
  const token = String(name || "").trim();
  if (!token) return makeBattleLogReminder("提醒", GENERIC_REMINDER_ROLE);
  const id = roleId || GENERIC_REMINDER_ROLE;
  if (id === GENERIC_REMINDER_ROLE) {
    return makeBattleLogReminder(token, GENERIC_REMINDER_ROLE);
  }
  const role = roleFromMap(rolesMap, id);
  if (!role) return makeBattleLogReminder(token, id);
  const reminder = {
    role: id,
    name: token,
    imageAlt: role.imageAlt || id,
  };
  if (role.image) reminder.image = role.image;
  return reminder;
}

/** Pick default reminderRole for a rule effect on the given role. */
export function defaultReminderRoleForRule(ruleId, reminderName, rolesMap) {
  const role = roleFromMap(rolesMap, ruleId);
  if (role) {
    const all = reminderNamesForRole(ruleId, rolesMap);
    if (all.includes(reminderName)) return ruleId;
  }
  return GENERIC_REMINDER_ROLE;
}
