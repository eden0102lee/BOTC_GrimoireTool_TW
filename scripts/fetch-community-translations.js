#!/usr/bin/env node
/**
 * Fetch community translations CSV (role reminders / names) from Google Sheets.
 * Default: COMMUNITY_TRANSLATIONS_SHEET in roleReminderCatalog (via export URL).
 *
 * Usage: npm run fetch:community-translations
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "raw", "community_translations_preview.csv");

const SHEET_ID = "1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg";
const GID = "1544433985";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Fetching", URL);
  const buf = await fetchUrl(URL);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("Wrote", OUT, `(${buf.length} bytes)`);
  console.log("Next: npm run build:characters && npm run sync:characters");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
