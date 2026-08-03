/**
 * One-off inventory generator for docs/interaction-rules-inventory.md
 * Run: node scripts/generate-interaction-inventory.js
 */
const fs = require("fs");
const path = require("path");

const rolesPath = path.join(__dirname, "../src/roles.json");
const builtinPath = path.join(__dirname, "../src/store/roleInteractionRules.json");

const roles = JSON.parse(fs.readFileSync(rolesPath, "utf8"));
const builtin = JSON.parse(fs.readFileSync(builtinPath, "utf8"));
const builtinMap = new Map((builtin.rules || []).map((r) => [r.id, r]));

const PASSIVE_IDS = new Set([
  "bountyhunter", "butler", "chef", "empath", "fortune_teller", "investigator",
  "librarian", "mayor", "monk", "ravenkeeper", "slayer", "soldier", "undertaker",
  "virgin", "washerwoman", "chef", "empath", "mathematician", "shiguan",
  "undertaker", "ravenkeeper", "slayer", "soldier", "mayor", "butler",
  "bountyhunter", "chef", "empath", "fortune_teller", "investigator", "librarian",
  "washerwoman", "monk", "ravenkeeper", "slayer", "soldier", "undertaker", "virgin",
  "recluse", "drunk", "saint", "politician", "heretic", "damsel", "goon",
  "scarlet_woman", "baron", "mastermind", "marionette", "boomdandy", "leviathan",
  "vizier", "beggar", "scapegoat", "atheist", "cannibal", "snitch", "heretic",
  "politician", "damsel", "boomdandy", "marionette", "leviathan", "vizier",
  "beggar", "scapegoat", "atheist", "cannibal", "snitch", "heretic", "politician",
  "damsel", "boomdandy", "marionette", "leviathan", "vizier", "beggar", "scapegoat",
]);

const SPECIALIZED = new Set([
  "yinyangshi", "washerwoman", "librarian", "investigator", "dreamer",
  "cerenovus", "pit-hag", "kazali", "grandmother", "widow", "puzzlemaster", "jiaohuazi",
  "chef", "empath", "mathematician", "shiguan", "fortune_teller", "undertaker",
  "ravenkeeper", "slayer", "monk", "poisoner", "spy", "scarlet_woman", "imp",
  "steward", "balloonist", "general", "mengpo", "jinweijun2", "organ_grinder", "barista",
]);

function classify(role) {
  const rule = builtinMap.get(role.id);
  if (rule) {
    if (rule.effects && rule.effects.length) return "complete";
    if (rule.inputs && rule.inputs.length) return "inputs-only";
    return "passive-rule";
  }
  if (!role.firstNight && !role.otherNight) return "no-night-order";
  if (SPECIALIZED.has(role.id)) return "draft-available";
  if (PASSIVE_IDS.has(role.id)) return "passive";
  return "fallback-default-target";
}

const groups = {};
roles.forEach((role) => {
  const status = classify(role);
  if (!groups[status]) groups[status] = [];
  groups[status].push(role);
});

const statusNotes = {
  complete: "已有完整互動規則（inputs + effects + 句子）",
  "inputs-only": "有規則但僅輸入／資訊類，無魔典連動",
  "draft-available": "roleInputConfig 有專屬欄位，可一鍵建草稿",
  "fallback-default-target": "夜動但僅預設「目標對象」，需補 effects",
  passive: "被動／setup，無夜動卡片",
  "no-night-order": "無 firstNight/otherNight",
  "passive-rule": "規則標記為被動",
};

let md = `# 戰報互動規則盤點

> 自動產生：\`node scripts/generate-interaction-inventory.js\`  
> 最後更新：${new Date().toISOString().slice(0, 10)}

## 摘要

| 狀態 | 數量 | 說明 |
| --- | ---: | --- |
`;

Object.keys(statusNotes).forEach((key) => {
  const count = (groups[key] || []).length;
  md += `| ${key} | ${count} | ${statusNotes[key]} |\n`;
});

md += `\n## 內建完整規則（種子）\n\n`;
(groups.complete || []).forEach((r) => {
  const rule = builtinMap.get(r.id);
  md += `- **${r.name}** (\`${r.id}\`) — effects: ${(rule.effects || []).map((e) => e.label || e.type).join("、") || "無"}\n`;
});

md += `\n## 需優先補 effects（fallback 預設目標）\n\n`;
md += `這些角色在夜序會出現能力卡，但目前只有「目標對象」輸入，尚未定義死亡／提醒等連動。\n\n`;
(groups["fallback-default-target"] || [])
  .sort((a, b) => a.name.localeCompare(b.name, "zh"))
  .forEach((r) => {
    md += `- ${r.name} (\`${r.id}\`) — team: ${r.team}\n`;
  });

md += `\n## 可從 roleInputConfig 建草稿\n\n`;
(groups["draft-available"] || [])
  .sort((a, b) => a.name.localeCompare(b.name, "zh"))
  .forEach((r) => {
    md += `- ${r.name} (\`${r.id}\`)\n`;
  });

md += `\n## 被動／無夜動卡片\n\n`;
(groups.passive || [])
  .sort((a, b) => a.name.localeCompare(b.name, "zh"))
  .forEach((r) => {
    md += `- ${r.name} (\`${r.id}\`)\n`;
  });

md += `\n## 建議下一批規則（TB 常用）\n\n`;
const tbPriority = [
  "imp", "poisoner", "monk", "washerwoman", "librarian", "investigator",
  "fortune_teller", "empath", "chef", "undertaker", "ravenkeeper", "slayer",
  "scarlet_woman", "spy", "baron", "butler", "drunk", "soldier", "mayor", "virgin",
];
tbPriority.forEach((id) => {
  const role = roles.find((r) => r.id === id);
  if (!role) return;
  const status = classify(role);
  const done = status === "complete" ? "✅" : "⬜";
  md += `- ${done} ${role.name} (\`${id}\`) — 目前：${status}\n`;
});

md += `\n## 缺口類型 backlog\n\n`;
md += `- **needs-death**：暗殺類（小惡魔、刺客變體等）→ \`setDead\`\n`;
md += `- **needs-reminder:中毒**：投毒者、某些 Loric\n`;
md += `- **needs-reminder:保護**：僧侶、某些保護類\n`;
md += `- **info-only**：資訊類（洗衣婦、圖書館員等）→ 無 effects，僅句子\n`;
md += `- **needs-role-change**：洗腦師、麻臉巫婆等 → 需新 effect 類型（未來）\n`;
md += `- **passive**：報喪女妖、士兵等 → 編輯器標記 enabled:false 或空 inputs\n`;

const outPath = path.join(__dirname, "../docs/interaction-rules-inventory.md");
fs.writeFileSync(outPath, md, "utf8");
console.log("Wrote", outPath);
console.log(
  Object.entries(groups)
    .map(([k, v]) => `${k}: ${v.length}`)
    .join(", "),
);
