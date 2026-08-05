#!/usr/bin/env node
/**
 * Audit roleInteractionRules effects vs spreadsheet/roles reminders.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data/raw/community_translations_preview.csv");
const ROLES_PATH = path.join(ROOT, "src/roles.json");
const RULES_PATH = path.join(ROOT, "src/store/roleInteractionRules.json");

function parseCsvRecords(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      current = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else current += ch;
  }
  if (current.length || row.length) {
    row.push(current);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

function loadCsvMap() {
  const text = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsvRecords(text);
  const headers = rows[0];
  const map = new Map();
  for (let i = 1; i < rows.length; i++) {
    const rec = {};
    headers.forEach((h, j) => {
      rec[h] = rows[i][j] != null ? rows[i][j] : "";
    });
    if (rec.id) map.set(rec.id.toLowerCase(), rec);
  }
  return map;
}

function parseReminderList(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const SKIP = new Set([
  "無能力", "?", "已發生", "已聲明", "已猜測", "不能提名", "Hat", "哇喔",
  "不正確", "訪客", "摯友", "雙胞胎", "已選擇", "視為惡魔", "處決",
]);

const rules = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
const roles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
const csvMap = loadCsvMap();

const ruleMap = new Map((rules.rules || []).map((r) => [r.id.toLowerCase(), r]));

const missing = [];
const ok = [];

roles.forEach((role) => {
  const id = role.id.toLowerCase();
  const csv = csvMap.get(id);
  const fromCsv = [
    ...parseReminderList(csv && csv.reminders),
    ...parseReminderList(csv && csv.remindersGlobal),
  ];
  const fromRole = [
    ...(role.reminders || []),
    ...(role.remindersGlobal || []),
  ];
  const allReminders = [...new Set([...fromCsv, ...fromRole])].filter(
    (r) => !SKIP.has(r),
  );
  if (!allReminders.length) return;

  const rule = ruleMap.get(id);
  const effectTokens = (rule && rule.effects || [])
    .filter((e) => e.type === "addReminder" || e.type === "removeReminder")
    .map((e) => e.reminderName)
    .filter(Boolean);

  const uncovered = allReminders.filter((t) => !effectTokens.includes(t));
  if (uncovered.length) {
    missing.push({
      id: role.id,
      name: role.name,
      reminders: allReminders,
      effectTokens,
      uncovered,
      hasRule: !!rule,
      inputCount: rule && rule.inputs ? rule.inputs.length : 0,
    });
  } else if (effectTokens.length) {
    ok.push(role.id);
  }
});

console.log("Missing reminder effects:", missing.length);
missing.sort((a, b) => a.id.localeCompare(b.id));
missing.forEach((m) => {
  console.log(
    `${m.id} (${m.name}): need [${m.uncovered.join(", ")}] | have [${m.effectTokens.join(", ")}] | inputs=${m.inputCount}`,
  );
});
