#!/usr/bin/env node
/**
 * Sync character icons + Simplified→Traditional text overlays from
 * https://script.bloodontheclocktower.com/
 *
 * Usage:
 *   node scripts/sync-from-script-tool.js
 *   node scripts/sync-from-script-tool.js --force-icons
 *   node scripts/sync-from-script-tool.js --skip-icons
 *   node scripts/sync-from-script-tool.js --overwrite-text  (replace existing TW with script-tool OpenCC)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const ICONS_DIR = path.join(ROOT, "src", "assets", "icons");
const SCRIPT_BASE = "https://script.bloodontheclocktower.com";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "clocktower-grimoire-TW-sync" } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }
          resolve(body);
        });
      })
      .on("error", reject);
  });
}

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

function unescapeJsString(raw) {
  try {
    return JSON.parse(`"${raw}"`);
  } catch (e) {
    return raw
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function extractJsonStringFields(objSrc) {
  const fields = {};
  const re = /"([a-zA-Z]+)":"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(objSrc))) {
    fields[m[1]] = unescapeJsString(m[2]);
  }
  return fields;
}

function extractCnCharacters(text) {
  // Match role objects that have a Chinese name; field order varies.
  const re =
    /"([a-z][a-z0-9]+)":\{([^{}]*"name":"[^"]*[\u4e00-\u9fff][^"]*"[^{}]*)\}/g;
  const map = {};
  let m;
  while ((m = re.exec(text))) {
    const id = m[1];
    if (map[id]) continue;
    const fields = extractJsonStringFields(m[2]);
    if (!fields.name || !/[\u4e00-\u9fff]/.test(fields.name)) continue;
    map[id] = {
      name: fields.name,
      ability: fields.ability || "",
      firstNightReminder: fields.first || fields.firstNightReminder || "",
      otherNightReminder: fields.other || fields.otherNightReminder || "",
      flavor: fields.flavor || ""
    };
  }
  return map;
}

function extractCnJinxes(text) {
  const start = text.indexOf('"jinxes":{"alchemist-boffin":"');
  if (start < 0) throw new Error("jinxes block not found");
  const brace = text.indexOf("{", start);
  // Take a generous window; jinx keys are id-id pairs
  const window = text.slice(brace, brace + 120000);
  const map = {};
  const re = /"([a-z0-9]+-[a-z0-9]+)":"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(window))) {
    const reason = unescapeJsString(m[2]);
    if (!/[\u4e00-\u9fff]/.test(reason)) {
      // Stop once we leave the Chinese jinx map
      if (Object.keys(map).length > 50) break;
      continue;
    }
    map[m[1]] = reason;
  }
  return map;
}

async function resolveWorkspaceJs() {
  const html = await fetchText(`${SCRIPT_BASE}/`);
  const matches = [
    ...new Set([...html.matchAll(/workspace\.[a-f0-9]+\.js/g)].map(m => m[0]))
  ];
  let best = null;
  let bestLen = 0;
  for (const name of matches) {
    const url = `${SCRIPT_BASE}/${name}`;
    const body = await fetchText(url);
    if (body.length > bestLen) {
      bestLen = body.length;
      best = { url, text: body };
    }
  }
  if (!best) throw new Error("Could not find workspace.*.js on script tool");
  console.log(`Using ${best.url} (${bestLen} bytes)`);
  return best.text;
}

async function ensureOpencc() {
  try {
    return require("opencc-js");
  } catch (e) {
    console.log("Installing opencc-js…");
    const { execSync } = require("child_process");
    const npmDir = path.dirname(process.execPath);
    execSync("npm install --no-save opencc-js", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, PATH: `${npmDir}${path.delimiter}${process.env.PATH || ""}` }
    });
    delete require.cache[require.resolve("opencc-js")];
    return require("opencc-js");
  }
}

async function ensureSharp() {
  try {
    return require("sharp");
  } catch (e) {
    console.log("Installing sharp…");
    const { execSync } = require("child_process");
    const npmDir = path.dirname(process.execPath);
    execSync("npm install --no-save sharp", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, PATH: `${npmDir}${path.delimiter}${process.env.PATH || ""}` }
    });
    delete require.cache[require.resolve("sharp")];
    return require("sharp");
  }
}

function looksTranslated(name) {
  return name && /[\u4e00-\u9fff]/.test(name);
}

/** Prefer evil (_e / red) or good (_g / blue) art by initial team. */
function alignmentSuffixes(team) {
  switch (team) {
    case "minion":
    case "demon":
      return ["_e", "_g", ""];
    case "townsfolk":
    case "outsider":
    case "traveler":
      return ["_g", "_e", ""];
    default:
      return [""];
  }
}

async function downloadIconFromScript(role, sharp, force) {
  const id = role.id;
  const dest = path.join(ICONS_DIR, `${id}.png`);
  if (!force && fs.existsSync(dest)) return false;

  const team = role.team === "traveller" ? "traveler" : role.team;
  const edition = role.edition === "carousel" ? "carousel" : role.edition || "";
  const candidates = [];
  if (team === "loric") {
    candidates.push(`loric/${id}.webp`);
  } else if (team === "fabled") {
    candidates.push(`fabled/${id}.webp`);
    candidates.push(`carousel/${id}.webp`);
    candidates.push(`carousel/${id}_g.webp`);
    candidates.push(`carousel/${id}_e.webp`);
  } else {
    const suffixes = alignmentSuffixes(team);
    const editions = [
      ...(edition ? [edition] : []),
      "carousel",
      "tb",
      "bmr",
      "snv",
      "custom"
    ].filter((v, i, a) => a.indexOf(v) === i);
    for (const ed of editions) {
      for (const suf of suffixes) {
        candidates.push(`${ed}/${id}${suf}.webp`);
      }
    }
  }

  for (const rel of candidates) {
    const url = `${SCRIPT_BASE}/src/assets/icons/${rel}`;
    try {
      const buf = await fetchBuffer(url);
      await sharp(buf).png().toFile(dest);
      console.log(`  icon ${id} ← ${rel}`);
      return true;
    } catch (e) {
      // next
    }
  }
  console.warn(`  icon missing for ${id}`);
  return false;
}

async function main() {
  const forceIcons = process.argv.includes("--force-icons");
  const skipIcons = process.argv.includes("--skip-icons");
  const overwriteText = process.argv.includes("--overwrite-text");

  console.log("Fetching script tool workspace bundle…");
  const text = await resolveWorkspaceJs();
  fs.mkdirSync(RAW, { recursive: true });

  const cnCharacters = extractCnCharacters(text);
  const cnJinxes = extractCnJinxes(text);
  fs.writeFileSync(
    path.join(RAW, "script-tool-characters-zh-CN.json"),
    JSON.stringify(cnCharacters, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(RAW, "script-tool-jinxes-zh-CN.json"),
    JSON.stringify(cnJinxes, null, 2) + "\n"
  );
  console.log(
    `Extracted CN characters: ${Object.keys(cnCharacters).length}, jinxes: ${
      Object.keys(cnJinxes).length
    }`
  );

  const OpenCC = await ensureOpencc();
  const converter = OpenCC.Converter({ from: "cn", to: "tw" });
  const s2t = t => (t ? converter(String(t)) : t);

  const twCharacters = {};
  for (const [id, entry] of Object.entries(cnCharacters)) {
    twCharacters[id] = {
      name: s2t(entry.name),
      ability: s2t(entry.ability),
      firstNightReminder: s2t(entry.firstNightReminder),
      otherNightReminder: s2t(entry.otherNightReminder),
      flavor: s2t(entry.flavor)
    };
  }
  const twJinxes = {};
  for (const [key, reason] of Object.entries(cnJinxes)) {
    twJinxes[key] = s2t(reason);
  }
  fs.writeFileSync(
    path.join(RAW, "script-tool-characters-zh-TW.json"),
    JSON.stringify(twCharacters, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(RAW, "script-tool-jinxes-zh-TW.json"),
    JSON.stringify(twJinxes, null, 2) + "\n"
  );

  const rolesPath = path.join(ROOT, "src", "roles.json");
  const fabledPath = path.join(ROOT, "src", "fabled.json");
  const loricPath = path.join(ROOT, "src", "loric.json");
  const hatredPath = path.join(ROOT, "src", "hatred.json");
  const localePath = path.join(ROOT, "src", "roles.zh_TW.json");

  const officialRoles = JSON.parse(
    fs.readFileSync(path.join(RAW, "official-roles.json"), "utf8")
  );
  const officialById = new Map(officialRoles.map(r => [r.id, r]));

  function applyTw(role) {
    const tw = twCharacters[role.id];
    const official = officialById.get(role.id);
    if (!tw) return { role, changed: false };
    let changed = false;
    const next = { ...role };
    const engName = official ? official.name : null;
    const engAbility = official ? official.ability : null;

    const shouldReplaceName =
      overwriteText ||
      !looksTranslated(next.name) ||
      (engName && next.name === engName);
    const shouldReplaceAbility =
      overwriteText ||
      !next.ability ||
      !looksTranslated(next.ability) ||
      (engAbility && next.ability === engAbility);

    if (shouldReplaceName && tw.name && next.name !== tw.name) {
      next.name = tw.name;
      changed = true;
    }
    if (shouldReplaceAbility && tw.ability && next.ability !== tw.ability) {
      next.ability = tw.ability;
      changed = true;
    }
    if (
      (overwriteText ||
        !next.firstNightReminder ||
        (official &&
          next.firstNightReminder === official.firstNightReminder)) &&
      tw.firstNightReminder &&
      next.firstNightReminder !== tw.firstNightReminder
    ) {
      next.firstNightReminder = tw.firstNightReminder;
      changed = true;
    }
    if (
      (overwriteText ||
        !next.otherNightReminder ||
        (official &&
          next.otherNightReminder === official.otherNightReminder)) &&
      tw.otherNightReminder &&
      next.otherNightReminder !== tw.otherNightReminder
    ) {
      next.otherNightReminder = tw.otherNightReminder;
      changed = true;
    }
    return { role: next, changed };
  }

  let textUpdates = 0;
  for (const file of [rolesPath, fabledPath, loricPath]) {
    const list = JSON.parse(fs.readFileSync(file, "utf8"));
    const out = list.map(role => {
      const { role: next, changed } = applyTw(role);
      if (changed) textUpdates++;
      return next;
    });
    fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  }

  const hatred = JSON.parse(fs.readFileSync(hatredPath, "utf8"));
  let jinxUpdates = 0;
  for (const entry of hatred) {
    for (const j of entry.hatred || []) {
      const key = `${entry.id}-${j.id}`;
      const alt = `${j.id}-${entry.id}`;
      const tw = twJinxes[key] || twJinxes[alt];
      if (!tw) continue;
      if (j.reason !== tw) {
        j.reason = tw;
        jinxUpdates++;
      }
    }
  }
  fs.writeFileSync(hatredPath, JSON.stringify(hatred, null, 2) + "\n");

  const roles = JSON.parse(fs.readFileSync(rolesPath, "utf8"));
  const localeOverlay = roles.map(role => {
    const overlay = { id: role.id, name: role.name, ability: role.ability };
    if (role.firstNightReminder)
      overlay.firstNightReminder = role.firstNightReminder;
    if (role.otherNightReminder)
      overlay.otherNightReminder = role.otherNightReminder;
    if (role.reminders && role.reminders.length) overlay.reminders = role.reminders;
    if (role.remindersGlobal && role.remindersGlobal.length)
      overlay.remindersGlobal = role.remindersGlobal;
    return overlay;
  });
  fs.writeFileSync(localePath, JSON.stringify(localeOverlay, null, 2) + "\n");

  console.log(`Character text fields updated: ${textUpdates}`);
  console.log(`Jinx reasons translated: ${jinxUpdates}`);

  if (!skipIcons) {
    const sharp = await ensureSharp();
    let icons = 0;
    for (const role of officialRoles) {
      const ok = await downloadIconFromScript(role, sharp, forceIcons);
      if (ok) icons++;
    }
    console.log(`Icons updated from script tool: ${icons}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
