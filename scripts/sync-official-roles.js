#!/usr/bin/env node
/**
 * Sync official BOTC roles / fabled / loric / jinxes from botc-release,
 * merge Traditional Chinese overlays (CSV + limpy S→T via opencc-js).
 *
 * Usage: npm run sync:official
 * Offline: set OFFICIAL_ROLES_JSON / etc, or place files under data/raw/
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const ROLES_PATH = path.join(ROOT, "src", "roles.json");
const FABLED_PATH = path.join(ROOT, "src", "fabled.json");
const LORIC_PATH = path.join(ROOT, "src", "loric.json");
const HATRED_PATH = path.join(ROOT, "src", "hatred.json");
const LOCALE_PATH = path.join(ROOT, "src", "roles.zh_TW.json");
const CSV_PATH = path.join(ROOT, "data", "raw", "characters_zh_TW.csv");
const ICONS_DIR = path.join(ROOT, "src", "assets", "icons");

const API_FILE =
  "https://api.github.com/repos/ThePandemoniumInstitute/botc-release/contents/";

const TEAM_ICON = {
  townsfolk: "good",
  outsider: "outsider",
  minion: "minion",
  demon: "evil",
  traveler: "traveler",
  traveller: "traveler",
  fabled: "fabled",
  loric: "fabled"
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "clocktower-grimoire-TW-sync", Accept: "application/vnd.github+json" } },
      res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchJson(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "clocktower-grimoire-TW-sync" } },
      res => {
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
      }
    );
    req.on("error", reject);
  });
}

async function loadOfficial(name) {
  const localPath = path.join(RAW, `official-${name}.json`);
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, "utf8"));
  }
  const meta = await fetchJson(`${API_FILE}resources/data/${name}.json`);
  const data = await fetchJson(meta.download_url);
  fs.mkdirSync(RAW, { recursive: true });
  fs.writeFileSync(localPath, JSON.stringify(data, null, 2) + "\n");
  return data;
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

function parseReminders(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    return value
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);
  }
}

function nightIndex(sheet, id) {
  const i = sheet.indexOf(id);
  return i < 0 ? 0 : i + 1;
}

function normalizeTeam(team) {
  if (team === "traveller") return "traveler";
  return team;
}

function escCsv(value) {
  const s = Array.isArray(value) ? value.join("|") : String(value == null ? "" : value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function ensureOpencc() {
  try {
    return require("opencc-js");
  } catch (e) {
    console.log("Installing opencc-js (temporary)…");
    const { execSync } = require("child_process");
    execSync("npm install --no-save opencc-js", {
      cwd: ROOT,
      stdio: "inherit"
    });
    return require("opencc-js");
  }
}

async function ensureSharp() {
  try {
    return require("sharp");
  } catch (e) {
    console.log("Installing sharp (temporary) for icon conversion…");
    const { execSync } = require("child_process");
    execSync("npm install --no-save sharp", { cwd: ROOT, stdio: "inherit" });
    return require("sharp");
  }
}

async function downloadIcon(role, sharp) {
  const id = role.id;
  const dest = path.join(ICONS_DIR, `${id}.png`);
  if (fs.existsSync(dest)) return false;

  const team = normalizeTeam(role.team);
  const edition = role.edition || "";
  const candidates = [];
  const alignmentSuffixes =
    team === "minion" || team === "demon"
      ? ["_e", "_g", ""]
      : team === "townsfolk" || team === "outsider" || team === "traveler"
        ? ["_g", "_e", ""]
        : [""];

  if (team === "loric") {
    candidates.push(`loric/${id}.webp`);
  } else if (team === "fabled") {
    candidates.push(`fabled/${id}.webp`);
    candidates.push(`carousel/${id}.webp`);
    candidates.push(`carousel/${id}_g.webp`);
    candidates.push(`carousel/${id}_e.webp`);
  } else {
    const editions = [
      ...(edition && edition !== "carousel" ? [edition] : []),
      "carousel",
      "tb",
      "bmr",
      "snv",
      "custom"
    ].filter((v, i, a) => a.indexOf(v) === i);
    for (const ed of editions) {
      for (const suf of alignmentSuffixes) {
        candidates.push(`${ed}/${id}${suf}.webp`);
      }
    }
  }

  const bases = [
    "https://script.bloodontheclocktower.com/src/assets/icons",
    "https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/main/resources/characters"
  ];
  for (const base of bases) {
    for (const rel of candidates) {
      const url = `${base}/${rel}`;
      try {
        const buf = await fetchBuffer(url);
        await sharp(buf).png().toFile(dest);
        console.log(`  icon ${id} ← ${base.includes("script.blood") ? "script" : "github"} ${rel}`);
        return true;
      } catch (e) {
        // try next
      }
    }
  }

  // fallback: copy team generic
  const alt = TEAM_ICON[team] || "custom";
  const src = path.join(ICONS_DIR, `${alt}.png`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  icon ${id} ← fallback ${alt}.png`);
    return true;
  }
  console.warn(`  icon missing for ${id}`);
  return false;
}

async function main() {
  const OpenCC = await ensureOpencc();
  const converter = OpenCC.Converter({ from: "cn", to: "tw" });
  const s2t = text => (text ? converter(String(text)) : text);

  const officialRoles = await loadOfficial("roles");
  const nightsheet = await loadOfficial("nightsheet");
  const officialJinxes = await loadOfficial("jinxes");

  const limpyRolesPath = path.join(RAW, "limpy-roles.json");
  const limpyFabledPath = path.join(RAW, "limpy-fabled.json");
  const limpyRoles = fs.existsSync(limpyRolesPath)
    ? JSON.parse(fs.readFileSync(limpyRolesPath, "utf8"))
    : [];
  const limpyFabled = fs.existsSync(limpyFabledPath)
    ? JSON.parse(fs.readFileSync(limpyFabledPath, "utf8"))
    : [];
  const limpyById = new Map(
    [...limpyRoles, ...limpyFabled].map(r => [r.id, r])
  );

  const csvRows = fs.existsSync(CSV_PATH)
    ? parseCsv(fs.readFileSync(CSV_PATH, "utf8"))
    : [];
  const csvById = new Map(csvRows.map(r => [r.id, r]));

  const existingRoles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
  const existingById = new Map(existingRoles.map(r => [r.id, r]));

  const playerTeams = new Set([
    "townsfolk",
    "outsider",
    "minion",
    "demon",
    "traveler",
    "traveller"
  ]);

  function looksTranslated(name, englishName) {
    if (!name) return false;
    if (englishName && name === englishName) return false;
    return /[\u4e00-\u9fff]/.test(name);
  }

  function overlayZh(base, id, englishName) {
    const csv = csvById.get(id);
    const limpy = limpyById.get(id);
    const out = { ...base };
    const csvOk = csv && looksTranslated(csv.name, englishName);
    if (csvOk) {
      if (csv.name) out.name = csv.name;
      if (csv.ability) out.ability = csv.ability;
      if (csv.firstNightReminder) out.firstNightReminder = csv.firstNightReminder;
      if (csv.otherNightReminder) out.otherNightReminder = csv.otherNightReminder;
      const rem = parseReminders(csv.reminders);
      if (rem) out.reminders = rem;
      const remG = parseReminders(csv.remindersGlobal);
      if (remG) out.remindersGlobal = remG;
      return out;
    }
    if (limpy && looksTranslated(limpy.name, englishName)) {
      if (limpy.name) out.name = s2t(limpy.name);
      if (limpy.ability) out.ability = s2t(limpy.ability);
      if (limpy.firstNightReminder)
        out.firstNightReminder = s2t(limpy.firstNightReminder);
      if (limpy.otherNightReminder)
        out.otherNightReminder = s2t(limpy.otherNightReminder);
      if (Array.isArray(limpy.reminders) && limpy.reminders.length)
        out.reminders = limpy.reminders.map(s2t);
      if (Array.isArray(limpy.remindersGlobal) && limpy.remindersGlobal.length)
        out.remindersGlobal = limpy.remindersGlobal.map(s2t);
    }
    return out;
  }

  function toLocalRole(official) {
    const id = official.id;
    const team = normalizeTeam(official.team);
    const existing = existingById.get(id);
    const limpy = limpyById.get(id);

    // Prefer existing night numbers to avoid reshuffling familiar scripts;
    // fall back to limpy, then official nightsheet.
    let firstNight =
      (existing && existing.firstNight) ||
      (limpy && limpy.firstNight) ||
      nightIndex(nightsheet.firstNight, id);
    let otherNight =
      (existing && existing.otherNight) ||
      (limpy && limpy.otherNight) ||
      nightIndex(nightsheet.otherNight, id);

    // Experimental / carousel → empty edition like other homebrew-adjacent roles
    let edition = official.edition || "";
    if (edition === "carousel") edition = "";
    if (existing && existing.edition !== undefined && official.edition !== "carousel") {
      edition = existing.edition;
    }

    const base = {
      id,
      name: official.name,
      edition,
      team,
      firstNight,
      otherNight,
      reminders: official.reminders || [],
      setup: !!official.setup,
      ability: official.ability || "",
      firstNightReminder: official.firstNightReminder || "",
      otherNightReminder: official.otherNightReminder || ""
    };
    if (official.remindersGlobal) base.remindersGlobal = official.remindersGlobal;

    // Preserve existing TW when it looks translated
    if (existing && looksTranslated(existing.name, official.name)) {
      base.name = existing.name;
      if (existing.ability) base.ability = existing.ability;
      if (existing.firstNightReminder)
        base.firstNightReminder = existing.firstNightReminder;
      if (existing.otherNightReminder)
        base.otherNightReminder = existing.otherNightReminder;
      if (existing.reminders) base.reminders = existing.reminders;
      if (existing.remindersGlobal) base.remindersGlobal = existing.remindersGlobal;
    }

    return overlayZh(base, id, official.name);
  }

  const fabled = [];
  const loric = [];
  const roles = [];

  for (const official of officialRoles) {
    const team = normalizeTeam(official.team);
    const local = toLocalRole(official);
    if (team === "fabled") {
      fabled.push({
        id: local.id,
        name: local.name,
        team: "fabled",
        ability: local.ability,
        setup: local.setup,
        reminders: local.reminders || [],
        firstNight: local.firstNight || 0,
        otherNight: local.otherNight || 0,
        firstNightReminder: local.firstNightReminder || "",
        otherNightReminder: local.otherNightReminder || ""
      });
    } else if (team === "loric") {
      loric.push({
        id: local.id,
        name: local.name,
        team: "loric",
        ability: local.ability,
        setup: local.setup,
        reminders: local.reminders || [],
        firstNight: local.firstNight || 0,
        otherNight: local.otherNight || 0,
        firstNightReminder: local.firstNightReminder || "",
        otherNightReminder: local.otherNightReminder || ""
      });
    } else if (playerTeams.has(official.team)) {
      roles.push(local);
    }
  }

  // Keep local-only roles not in official (skip known renames)
  const renamedAway = new Set(["mephit"]); // → mezepheles
  for (const r of existingRoles) {
    if (renamedAway.has(r.id)) continue;
    if (!roles.some(x => x.id === r.id) && playerTeams.has(r.team)) {
      roles.push(r);
    }
  }

  // Sort like townsquare: by team then keep stable
  const teamOrder = {
    townsfolk: 1,
    outsider: 2,
    minion: 3,
    demon: 4,
    traveler: 5
  };
  roles.sort(
    (a, b) =>
      (teamOrder[a.team] || 9) - (teamOrder[b.team] || 9) ||
      a.id.localeCompare(b.id)
  );
  fabled.sort((a, b) => a.id.localeCompare(b.id));
  loric.sort((a, b) => a.id.localeCompare(b.id));

  // Jinxes → hatred.json shape
  const hatred = officialJinxes.map(entry => ({
    id: entry.id,
    hatred: (entry.jinx || entry.hatred || []).map(j => ({
      id: j.id,
      reason: j.reason
    }))
  }));

  // Locale overlay for player roles
  const localeOverlay = roles.map(role => {
    const overlay = { id: role.id };
    const csv = csvById.get(role.id);
    const limpy = limpyById.get(role.id);
    if (csv || limpy || role.name) {
      overlay.name = role.name;
      overlay.ability = role.ability;
      if (role.firstNightReminder)
        overlay.firstNightReminder = role.firstNightReminder;
      if (role.otherNightReminder)
        overlay.otherNightReminder = role.otherNightReminder;
      if (role.reminders && role.reminders.length) overlay.reminders = role.reminders;
      if (role.remindersGlobal && role.remindersGlobal.length)
        overlay.remindersGlobal = role.remindersGlobal;
    }
    return overlay;
  });

  // Expand CSV with any new ids (TW already applied)
  const csvIds = new Set(csvRows.map(r => r.id));
  const newCsvRows = [...csvRows];
  for (const role of [...roles, ...fabled, ...loric]) {
    if (csvIds.has(role.id)) continue;
    // Only append if we have non-English name
    if (role.name && role.name !== officialRoles.find(o => o.id === role.id)?.name) {
      newCsvRows.push({
        id: role.id,
        name: role.name,
        ability: role.ability || "",
        firstNightReminder: role.firstNightReminder || "",
        otherNightReminder: role.otherNightReminder || "",
        reminders: (role.reminders || []).join("|"),
        remindersGlobal: (role.remindersGlobal || []).join("|")
      });
      csvIds.add(role.id);
    }
  }
  const csvOut =
    "id,name,ability,firstNightReminder,otherNightReminder,reminders,remindersGlobal\n" +
    newCsvRows
      .map(r =>
        [
          r.id,
          escCsv(r.name),
          escCsv(r.ability),
          escCsv(r.firstNightReminder),
          escCsv(r.otherNightReminder),
          escCsv(r.reminders),
          escCsv(r.remindersGlobal)
        ].join(",")
      )
      .join("\n") +
    "\n";

  fs.writeFileSync(ROLES_PATH, JSON.stringify(roles, null, 2) + "\n");
  fs.writeFileSync(FABLED_PATH, JSON.stringify(fabled, null, 2) + "\n");
  fs.writeFileSync(LORIC_PATH, JSON.stringify(loric, null, 2) + "\n");
  fs.writeFileSync(HATRED_PATH, JSON.stringify(hatred, null, 2) + "\n");
  fs.writeFileSync(LOCALE_PATH, JSON.stringify(localeOverlay, null, 2) + "\n");
  fs.writeFileSync(CSV_PATH, csvOut);

  console.log(
    `Roles ${roles.length}, fabled ${fabled.length}, loric ${loric.length}, jinxes ${hatred.length}`
  );

  // Icons for anything missing
  const sharp = await ensureSharp();
  let iconsAdded = 0;
  for (const role of [...roles, ...fabled, ...loric]) {
    const before = fs.existsSync(path.join(ICONS_DIR, `${role.id}.png`));
    if (!before) {
      const ok = await downloadIcon(
        officialRoles.find(o => o.id === role.id) || role,
        sharp
      );
      if (ok) iconsAdded++;
    }
  }
  // also ensure loric generic
  const loricGeneric = path.join(ICONS_DIR, "loric.png");
  if (!fs.existsSync(loricGeneric)) {
    try {
      const buf = await fetchBuffer(
        "https://raw.githubusercontent.com/ThePandemoniumInstitute/botc-release/main/resources/characters/generic/loric.webp"
      );
      await sharp(buf).png().toFile(loricGeneric);
      iconsAdded++;
      console.log("  icon loric.png ← generic");
    } catch (e) {
      fs.copyFileSync(path.join(ICONS_DIR, "fabled.png"), loricGeneric);
    }
  }
  console.log(`Icons added: ${iconsAdded}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
