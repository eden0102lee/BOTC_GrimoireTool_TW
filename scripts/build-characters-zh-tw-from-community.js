#!/usr/bin/env node
/**
 * Build data/raw/characters_zh_TW.csv from community_translations_preview.csv
 * Usage: node scripts/build-characters-zh-tw-from-community.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IN_PATH = path.join(ROOT, "data", "raw", "community_translations_preview.csv");
const OUT_PATH = path.join(ROOT, "data", "raw", "characters_zh_TW.csv");

const OUT_HEADERS = [
  "id",
  "name",
  "ability",
  "firstNightReminder",
  "otherNightReminder",
  "reminders",
  "remindersGlobal",
];

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
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      current = "";
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      current += ch;
    }
  }
  if (current.length || row.length) {
    row.push(current);
    if (row.some(cell => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function escapeCsvField(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function normalizeReminderField(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
      .join("|");
  }
  return trimmed;
}

function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`Input not found: ${IN_PATH}`);
    process.exit(1);
  }

  const text = fs.readFileSync(IN_PATH, "utf8");
  const records = parseCsvRecords(text);
  if (!records.length) {
    console.error("Input CSV is empty");
    process.exit(1);
  }

  const inHeader = records[0].map(h => h.trim());
  const rows = [];

  for (let i = 1; i < records.length; i++) {
    const cols = records[i];
    const row = {};
    inHeader.forEach((key, idx) => {
      row[key] = (cols[idx] || "").trim();
    });
    if (!row.id) continue;

    rows.push({
      id: row.id,
      name: row.name || "",
      ability: row.ability || "",
      firstNightReminder: row.firstNightReminder || "",
      otherNightReminder: row.otherNightReminder || "",
      reminders: normalizeReminderField(row.reminders),
      remindersGlobal: normalizeReminderField(row.remindersGlobal),
    });
  }

  const outLines = [OUT_HEADERS.join(",")];
  for (const row of rows) {
    outLines.push(
      OUT_HEADERS.map(key => escapeCsvField(row[key])).join(",")
    );
  }

  fs.writeFileSync(OUT_PATH, outLines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${rows.length} rows to ${OUT_PATH}`);
}

main();
