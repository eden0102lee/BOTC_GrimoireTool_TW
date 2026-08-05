/** Canonical role-type labels — keep in sync with scripts/team-terms.js */
export const TEAM_LABELS = {
  townsfolk: "鎮民",
  outsider: "外來者",
  minion: "爪牙",
  demon: "惡魔",
  traveler: "旅行者",
};

export const TEAM_CATEGORY_OPTIONS = ["爪牙", "外來者", "惡魔", "旅行者", "鎮民"];

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

export function normalizeTeamTerms(text) {
  if (text == null || typeof text !== "string") return text;
  let out = text;
  for (const [from, to] of TEAM_TERM_REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}
