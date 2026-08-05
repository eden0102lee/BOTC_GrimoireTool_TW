#!/usr/bin/env node
/**
 * Normalize legacy 僕從/城外人 → 爪牙/外來者 across roles + CSV sources.
 */
const fs = require("fs");
const path = require("path");
const {
  normalizeTeamTerms,
  normalizeRoleObject,
} = require("./team-terms");

const ROOT = path.join(__dirname, "..");

const TEXT_FILES = [
  "data/raw/community_translations_preview.csv",
  "data/raw/characters_zh_TW.csv",
  "data/raw/_community_translations_gviz.csv",
  "src/store/roleInteractionRules.json",
  "docs/interaction-rules-inventory.md",
];

function normalizeJsonRoles(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(raw)) {
    const next = raw.map(normalizeRoleObject);
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf8");
    return;
  }
  if (raw.rules && Array.isArray(raw.rules)) {
    raw.rules = raw.rules.map((rule) => {
      const next = { ...rule };
      if (typeof next.notes === "string") next.notes = normalizeTeamTerms(next.notes);
      if (Array.isArray(next.inputs)) {
        next.inputs = next.inputs.map((input) => ({
          ...input,
          label: normalizeTeamTerms(input.label),
          options: Array.isArray(input.options)
            ? input.options.map((o) => normalizeTeamTerms(o))
            : input.options,
        }));
      }
      if (Array.isArray(next.effects)) {
        next.effects = next.effects.map((effect) => ({
          ...effect,
          label: normalizeTeamTerms(effect.label),
          reminderName: normalizeTeamTerms(effect.reminderName),
        }));
      }
      return next;
    });
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n", "utf8");
    return;
  }
  throw new Error(`Unsupported JSON shape: ${filePath}`);
}

function main() {
  const rolesPath = path.join(ROOT, "src/roles.json");
  const localePath = path.join(ROOT, "src/roles.zh_TW.json");

  [rolesPath, localePath].forEach((filePath) => {
    normalizeJsonRoles(filePath);
    console.log("Normalized", path.relative(ROOT, filePath));
  });

  TEXT_FILES.forEach((rel) => {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) {
      console.warn("Skip (missing):", rel);
      return;
    }
    const before = fs.readFileSync(filePath, "utf8");
    const after = normalizeTeamTerms(before);
    if (before !== after) {
      fs.writeFileSync(filePath, after, "utf8");
      console.log("Normalized", rel);
    }
  });
}

main();
