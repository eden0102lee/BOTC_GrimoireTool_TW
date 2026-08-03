#!/usr/bin/env node
/**
 * Sync Traditional Chinese character names/abilities from CSV into src/roles.json
 * Usage: npm run sync:characters
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data", "raw", "characters_zh_TW.csv");
const ROLES_PATH = path.join(ROOT, "src", "roles.json");
const LOCALE_PATH = path.join(ROOT, "src", "roles.zh_TW.json");

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.startsWith("#"));
  if (!lines.length) return [];

  const header = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = splitCsvLine(line);
    const row = {};
    header.forEach((key, i) => {
      row[key] = (cols[i] || "").trim();
    });
    return row;
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseReminders(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value.split("|").map(s => s.trim()).filter(Boolean);
  }
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const csvRows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
  const byId = new Map(csvRows.map(r => [r.id, r]));

  const roles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
  let updated = 0;
  let missing = [];

  const localeOverlay = roles.map(role => {
    const row = byId.get(role.id);
    if (!row) return { id: role.id };

    updated++;
    const overlay = { id: role.id };
    if (row.name) overlay.name = row.name;
    if (row.ability) overlay.ability = row.ability;
    if (row.firstNightReminder) overlay.firstNightReminder = row.firstNightReminder;
    if (row.otherNightReminder) overlay.otherNightReminder = row.otherNightReminder;
    const reminders = parseReminders(row.reminders);
    if (reminders) overlay.reminders = reminders;
    const remindersGlobal = parseReminders(row.remindersGlobal);
    if (remindersGlobal) overlay.remindersGlobal = remindersGlobal;
    return overlay;
  });

  byId.forEach((row, id) => {
    if (!roles.some(r => r.id === id)) missing.push(id);
  });

  fs.writeFileSync(LOCALE_PATH, JSON.stringify(localeOverlay, null, 2) + "\n");

  const merged = roles.map(role => {
    const row = byId.get(role.id);
    if (!row) return role;
    const mergedRole = { ...role };
    if (row.name) mergedRole.name = row.name;
    if (row.ability) mergedRole.ability = row.ability;
    if (row.firstNightReminder) mergedRole.firstNightReminder = row.firstNightReminder;
    if (row.otherNightReminder) mergedRole.otherNightReminder = row.otherNightReminder;
    const reminders = parseReminders(row.reminders);
    if (reminders) mergedRole.reminders = reminders;
    const remindersGlobal = parseReminders(row.remindersGlobal);
    if (remindersGlobal) mergedRole.remindersGlobal = remindersGlobal;
    return mergedRole;
  });

  fs.writeFileSync(ROLES_PATH, JSON.stringify(merged, null, 2) + "\n");

  console.log(`Synced ${updated} roles from CSV.`);
  console.log(`Wrote overlay: ${LOCALE_PATH}`);
  console.log(`Updated: ${ROLES_PATH}`);
  if (missing.length) {
    console.warn(`CSV rows with unknown ids (skipped): ${missing.join(", ")}`);
  }
}

main();
