#!/usr/bin/env node
/**
 * Re-download character icons tinted by initial alignment:
 *   townsfolk / outsider → _g (blue)
 *   minion / demon       → _e (red)
 *   traveler             → _g then _e
 *   fabled / loric       → unaligned paths
 *
 * Usage: node scripts/sync-alignment-icons.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "src", "assets", "icons");
const SCRIPT_BASE = "https://script.bloodontheclocktower.com/src/assets/icons";
const GH_BASE =
  "https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/main/resources/characters";

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "clocktower-grimoire-TW-sync" } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          resolve(Buffer.concat(chunks));
        });
      })
      .on("error", reject);
  });
}

function normalizeTeam(team) {
  return team === "traveller" ? "traveler" : team;
}

/** Preferred alignment tint for token art. */
function alignmentSuffixes(team) {
  switch (normalizeTeam(team)) {
    case "minion":
    case "demon":
      return ["_e", "_g", ""];
    case "townsfolk":
    case "outsider":
      return ["_g", "_e", ""];
    case "traveler":
      return ["_g", "_e", ""];
    default:
      return [""];
  }
}

function iconCandidates(role) {
  const id = role.id;
  const team = normalizeTeam(role.team);
  const edition =
    !role.edition || role.edition === "carousel" ? "" : role.edition;
  const editions = [
    ...(edition ? [edition] : []),
    "carousel",
    "tb",
    "bmr",
    "snv",
    "custom"
  ].filter((v, i, a) => a.indexOf(v) === i);

  if (team === "loric") return [`loric/${id}.webp`];
  if (team === "fabled") {
    return [
      `fabled/${id}.webp`,
      `carousel/${id}.webp`,
      `carousel/${id}_g.webp`,
      `carousel/${id}_e.webp`
    ];
  }

  const suffixes = alignmentSuffixes(team);
  const candidates = [];
  for (const ed of editions) {
    for (const suf of suffixes) {
      candidates.push(`${ed}/${id}${suf}.webp`);
    }
  }
  return candidates;
}

async function ensureSharp() {
  try {
    return require("sharp");
  } catch (e) {
    const { execSync } = require("child_process");
    const npmDir = path.dirname(process.execPath);
    execSync("npm install --no-save sharp", {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${npmDir}${path.delimiter}${process.env.PATH || ""}`
      }
    });
    return require("sharp");
  }
}

async function downloadIcon(role, sharp) {
  const dest = path.join(ICONS_DIR, `${role.id}.png`);
  const candidates = iconCandidates(role);
  for (const base of [SCRIPT_BASE, GH_BASE]) {
    for (const rel of candidates) {
      try {
        const buf = await fetchBuffer(`${base}/${rel}`);
        await sharp(buf).png().toFile(dest);
        const src = base.includes("script.blood") ? "script" : "github";
        console.log(`  ${role.id} (${role.team}) ← ${src} ${rel}`);
        return rel;
      } catch (e) {
        // try next
      }
    }
  }
  console.warn(`  MISSING ${role.id} (${role.team})`);
  return null;
}

async function main() {
  const sharp = await ensureSharp();
  const official = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data", "raw", "official-roles.json"), "utf8")
  );
  let ok = 0;
  let fail = 0;
  const bySuffix = { _e: 0, _g: 0, plain: 0 };
  for (const role of official) {
    const rel = await downloadIcon(role, sharp);
    if (rel) {
      ok++;
      if (rel.includes("_e.")) bySuffix._e++;
      else if (rel.includes("_g.")) bySuffix._g++;
      else bySuffix.plain++;
    } else fail++;
  }
  console.log(`Done: ${ok} ok, ${fail} missing — _e=${bySuffix._e} _g=${bySuffix._g} plain=${bySuffix.plain}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
