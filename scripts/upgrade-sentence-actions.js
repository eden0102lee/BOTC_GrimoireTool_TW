/**
 * One-shot: upgrade sentence.action from 使用能力 → short verbs.
 * Run: node scripts/upgrade-sentence-actions.js
 */
const fs = require("fs");
const path = require("path");

const RULES_PATH = path.join(__dirname, "../src/store/roleInteractionRules.json");

function verb(rule) {
  let a = (rule.sentence && rule.sentence.action) || "選擇";
  if (a === "使用能力") a = "選擇";
  if (a !== "選擇") return a;
  const t = (rule.sentence && rule.sentence.template) || "";
  const effects = rule.effects || [];
  if (
    t.includes("中毒") ||
    effects.some((e) => e.type === "addReminder" && e.reminderName === "中毒")
  ) {
    return "投毒";
  }
  if (
    t.includes("死亡") ||
    effects.some((e) => e.type === "setDead" && e.value !== false)
  ) {
    return "殺害";
  }
  if (
    t.includes("保護") ||
    effects.some((e) => e.type === "addReminder" && e.reminderName === "保護")
  ) {
    return "保護";
  }
  return "選擇";
}

const doc = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
let n = 0;
(doc.rules || []).forEach((r) => {
  if (!r.sentence) {
    r.sentence = { action: "選擇", template: "{actor} → {action}" };
    n++;
    return;
  }
  const next = verb(r);
  if (r.sentence.action !== next) {
    r.sentence.action = next;
    n++;
  }
});
fs.writeFileSync(RULES_PATH, JSON.stringify(doc, null, 2) + "\n", "utf8");
console.log("updated actions:", n);
