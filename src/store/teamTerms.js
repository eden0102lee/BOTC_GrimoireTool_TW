/** Canonical role-type labels — keep in sync with scripts/team-terms.js */
export const TEAM_LABELS = {
  townsfolk: "鎮民",
  outsider: "外來者",
  minion: "爪牙",
  demon: "惡魔",
  traveler: "旅行者",
};

export const TEAM_CATEGORY_OPTIONS = ["爪牙", "外來者", "惡魔", "旅行者", "鎮民"];

/** Player alignment — independent from role.team (evil townsfolk / good demon). */
export const ALIGNMENT_LABELS = {
  good: "善良",
  evil: "邪惡",
};

/** Default alignment when a role of this team is assigned (initial only). */
export function defaultAlignmentForTeam(team) {
  const t = String(team || "").toLowerCase();
  if (t === "townsfolk" || t === "outsider") return "good";
  if (t === "minion" || t === "demon") return "evil";
  return null;
}

export function normalizeAlignment(value) {
  if (value === "good" || value === "evil") return value;
  if (value === "善良" || value === "Good" || value === "good (Good)") return "good";
  if (value === "邪惡" || value === "Evil" || value === "evil (Evil)") return "evil";
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "good" || raw.startsWith("善良")) return "good";
  if (raw === "evil" || raw.startsWith("邪惡") || raw.startsWith("邪恶")) return "evil";
  return null;
}

/** Current alignment for filtering; falls back to role.team default if unset. */
export function resolvePlayerAlignment(player) {
  if (!player) return null;
  const explicit = normalizeAlignment(player.alignment);
  if (explicit) return explicit;
  return defaultAlignmentForTeam(player.role && player.role.team);
}

export function alignmentLabel(alignment) {
  const a = normalizeAlignment(alignment);
  return a ? ALIGNMENT_LABELS[a] : "";
}

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
