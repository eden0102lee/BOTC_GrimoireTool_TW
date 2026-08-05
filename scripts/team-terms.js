/**
 * Canonical Blood on the Clocktower role-type terms (Traditional Chinese).
 * 鎮民 / 外來者 / 爪牙 / 惡魔 — align legacy 城外人、僕從 variants.
 */
const TEAM_TERM_REPLACEMENTS = [
  ["非僕從", "非爪牙"],
  ["非城外人", "非外來者"],
  ["僕從提名", "爪牙提名"],
  ["僕從未提名", "爪牙未提名"],
  ["第一位城外人", "第一位外來者"],
  ["城外人死亡", "外來者死亡"],
  ["已得知(僕從)", "已得知(爪牙)"],
  ["已得知(城外人)", "已得知(外來者)"],
  ["僕從", "爪牙"],
  ["城外人", "外來者"],
];

const TEAM_CATEGORY_OPTIONS = ["爪牙", "外來者", "惡魔", "旅行者", "鎮民"];

function normalizeTeamTerms(text) {
  if (text == null || typeof text !== "string") return text;
  let out = text;
  for (const [from, to] of TEAM_TERM_REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

function normalizeReminders(list) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => normalizeTeamTerms(item));
}

function normalizeRoleObject(role) {
  if (!role || typeof role !== "object") return role;
  const next = { ...role };
  if (typeof next.ability === "string") next.ability = normalizeTeamTerms(next.ability);
  if (typeof next.firstNightReminder === "string") {
    next.firstNightReminder = normalizeTeamTerms(next.firstNightReminder);
  }
  if (typeof next.otherNightReminder === "string") {
    next.otherNightReminder = normalizeTeamTerms(next.otherNightReminder);
  }
  if (Array.isArray(next.reminders)) next.reminders = normalizeReminders(next.reminders);
  if (Array.isArray(next.remindersGlobal)) {
    next.remindersGlobal = normalizeReminders(next.remindersGlobal);
  }
  return next;
}

module.exports = {
  TEAM_TERM_REPLACEMENTS,
  TEAM_CATEGORY_OPTIONS,
  normalizeTeamTerms,
  normalizeReminders,
  normalizeRoleObject,
};
