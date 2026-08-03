#!/usr/bin/env node
/**
 * Offline merge of data/raw/official-*.json + limpy extracts into src/.
 * Prefer: npm run sync:official (online). This path avoids network/npm installs.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(RAW, name), "utf8"));
}

function nightIndex(sheet, id) {
  const i = sheet.indexOf(id);
  return i < 0 ? 0 : i + 1;
}

function normalizeTeam(team) {
  return team === "traveller" ? "traveler" : team;
}

// Minimal CN→TW for limpy BOTC strings (phrase-first)
const PAIRS = [
  ["事务官", "事務官"],
  ["维齐尔", "維齊爾"],
  ["报丧女妖", "報喪女妖"],
  ["瘟疫医生", "瘟疫醫生"],
  ["鹰身女妖", "鷹身女妖"],
  ["街头风琴手", "街頭風琴手"],
  ["科学怪人", "科學怪人"],
  ["堤丰之首", "堤豐之首"],
  ["首席律师", "首席律師"],
  ["私货商人", "私貨商人"],
  ["园丁", "園丁"],
  ["讷神", "訥神"],
  ["讷帽", "訥帽"],
  ["诡诈杰克", "詭詐傑克"],
  ["暴风捕手", "暴風捕手"],
  ["遗忘之门", "遺忘之門"],
  ["腹语师", "腹語師"],
  ["异术士", "異術士"],
  ["摆渡人", "擺渡人"],
  ["失败的上帝", "失敗的上帝"],
  ["说书人", "說書人"],
  ["外来者", "外來者"],
  ["镇民", "鎮民"],
  ["恶魔", "惡魔"],
  ["邪恶", "邪惡"],
  ["阵营", "陣營"],
  ["伪装", "偽裝"],
  ["标记", "標記"],
  ["唤醒", "喚醒"],
  ["得知", "得知"],
  ["选择", "選擇"],
  ["处决", "處決"],
  ["投票", "投票"],
  ["游戏", "遊戲"],
  ["剧本", "劇本"],
  ["角色", "角色"],
  ["能力", "能力"],
  ["信息", "資訊"],
  ["疯狂", "瘋狂"],
  ["公开", "公開"],
  ["获得", "獲得"],
  ["死亡", "死亡"],
  ["存活", "存活"],
  ["玩家", "玩家"],
  ["骑士", "騎士"],
  ["隐士", "隱士"],
  ["狂热者", "狂熱者"],
  ["巫师", "巫師"],
  ["召唤师", "召喚師"],
  ["奥赫", "奧赫"],
  ["会", "會"],
  ["个", "個"],
  ["这", "這"],
  ["为", "為"],
  ["与", "與"],
  ["从", "從"],
  ["来", "來"],
  ["时", "時"],
  ["间", "間"],
  ["门", "門"],
  ["开", "開"],
  ["关", "關"],
  ["闭", "閉"],
  ["觉", "覺"],
  ["应", "應"],
  ["该", "該"],
  ["让", "讓"],
  ["给", "給"],
  ["过", "過"],
  ["还", "還"],
  ["选", "選"],
  ["择", "擇"],
  ["据", "據"],
  ["报", "報"],
  ["头", "頭"],
  ["发", "發"],
  ["现", "現"],
  ["实", "實"],
  ["击", "擊"],
  ["杀", "殺"],
  ["执", "執"],
  ["处", "處"],
  ["决", "決"],
  ["记", "記"],
  ["术", "術"],
  ["异", "異"],
  ["语", "語"],
  ["词", "詞"],
  ["阵", "陣"],
  ["营", "營"],
  ["恶", "惡"],
  ["伪", "偽"],
  ["装", "裝"],
  ["标", "標"],
  ["唤", "喚"],
  ["证", "證"],
  ["认", "認"],
  ["识", "識"],
  ["议", "議"],
  ["请", "請"],
  ["诉", "訴"],
  ["尔", "爾"],
  ["齐", "齊"],
  ["风", "風"],
  ["计", "計"],
  ["黄", "黃"],
  ["数", "數"],
  ["于", "於"],
  ["将", "將"],
  ["当", "當"],
  ["戏", "戲"],
  ["许", "許"],
  ["愿", "願"],
  ["价", "價"],
  ["线", "線"],
  ["转", "轉"],
  ["复", "複"],
  ["单", "單"],
  ["节", "節"],
  ["违", "違"],
  ["场", "場"],
  ["话", "話"],
  ["杰", "傑"],
  ["换", "換"],
  ["布", "佈"],
  ["们", "們"],
  ["条", "條"],
  ["达", "達"],
  ["败", "敗"],
  ["并", "並"],
  ["纠", "糾"],
  ["没", "沒"],
  ["顺", "順"],
  ["逆", "逆"],
  ["针", "針"],
  ["离", "離"],
  ["侧", "側"],
  ["谁", "誰"],
  ["对", "對"],
  ["胜", "勝"],
  ["变", "變"],
  ["须", "須"],
  ["否", "否"],
  ["则", "則"],
  ["么", "麼"],
  ["无", "無"],
  ["邻", "鄰"],
  ["睁", "睜"],
  ["医", "醫"],
  ["热", "熱"],
  ["鹰", "鷹"],
  ["丰", "豐"],
  ["货", "貨"],
  ["园", "園"],
  ["讷", "訥"],
  ["诡", "詭"],
  ["诈", "詐"],
  ["骑", "騎"],
  ["隐", "隱"],
  ["丧", "喪"],
  ["务", "務"],
  ["学", "學"],
  ["经", "經"],
  ["边", "邊"],
  ["里", "裡"],
  ["后", "後"],
  ["长", "長"],
  ["双", "雙"],
  ["战", "戰"],
  ["难", "難"],
  ["问", "問"],
  ["题", "題"],
  ["听", "聽"],
  ["见", "見"],
  ["观", "觀"],
  ["钟", "鐘"],
  ["楼", "樓"],
  ["团", "團"],
  ["吗", "嗎"],
  ["别", "別"],
  ["样", "樣"],
  ["内", "內"],
  ["备", "備"],
  ["杂", "雜"],
  ["体", "體"],
  ["态", "態"],
  ["灵", "靈"],
  ["龙", "龍"],
  ["东", "東"],
  ["网", "網"],
  ["页", "頁"],
  ["码", "碼"],
  ["联", "聯"],
  ["敌", "敵"],
  ["图", "圖"],
  ["画", "畫"],
  ["谢", "謝"],
  ["错", "錯"],
  ["响", "響"],
  ["哟", "喲"],
  ["喽", "嘍"],
  ["喂", "餵"],
  ["拥", "擁"],
  ["摆", "擺"],
  ["测", "測"],
  ["获", "獲"],
  ["两", "兩"],
  ["吨", "噸"]
].sort((a, b) => b[0].length - a[0].length);

function s2t(text) {
  if (!text) return text;
  let out = String(text);
  for (const [a, b] of PAIRS) {
    if (out.includes(a)) out = out.split(a).join(b);
  }
  return out;
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
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += ch;
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

function escCsv(value) {
  const s = Array.isArray(value)
    ? value.join("|")
    : String(value == null ? "" : value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const officialRoles = read("official-roles.json");
  const nightsheet = read("official-nightsheet.json");
  const officialJinxes = read("official-jinxes.json");
  const limpyRoles = read("limpy-roles.json");
  const limpyFabled = read("limpy-fabled.json");
  const limpyById = new Map(
    [...limpyRoles, ...limpyFabled].map(r => [r.id, r])
  );

  const csvPath = path.join(RAW, "characters_zh_TW.csv");
  const csvRows = fs.existsSync(csvPath)
    ? parseCsv(fs.readFileSync(csvPath, "utf8"))
    : [];
  const csvById = new Map(csvRows.map(r => [r.id, r]));

  const existingRoles = JSON.parse(
    fs.readFileSync(path.join(ROOT, "src", "roles.json"), "utf8")
  );
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
    // Prefer rows that contain CJK
    return /[\u4e00-\u9fff]/.test(name);
  }

  function applyZh(base, id, englishName) {
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

  function toLocal(official) {
    const id = official.id;
    const team = normalizeTeam(official.team);
    const existing = existingById.get(id);
    const limpy = limpyById.get(id);
    let firstNight =
      (existing && existing.firstNight) ||
      (limpy && limpy.firstNight) ||
      nightIndex(nightsheet.firstNight, id);
    let otherNight =
      (existing && existing.otherNight) ||
      (limpy && limpy.otherNight) ||
      nightIndex(nightsheet.otherNight, id);
    let edition = official.edition || "";
    if (edition === "carousel") edition = "";
    if (
      existing &&
      existing.edition !== undefined &&
      official.edition !== "carousel"
    ) {
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
      if (existing.remindersGlobal)
        base.remindersGlobal = existing.remindersGlobal;
    }
    return applyZh(base, id, official.name);
  }

  const fabled = [];
  const loric = [];
  const roles = [];

  for (const official of officialRoles) {
    const team = normalizeTeam(official.team);
    const local = toLocal(official);
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

  const hatred = officialJinxes.map(entry => ({
    id: entry.id,
    hatred: (entry.jinx || entry.hatred || []).map(j => ({
      id: j.id,
      reason: j.reason
    }))
  }));

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

  // Rebuild CSV rows: keep good TW rows, replace English stubs, append new TW
  const officialNameById = new Map(officialRoles.map(o => [o.id, o.name]));
  const mergedById = new Map(
    [...roles, ...fabled, ...loric].map(r => [r.id, r])
  );
  const newCsvRows = [];
  const seen = new Set();
  for (const row of csvRows) {
    const officialName = officialNameById.get(row.id);
    const merged = mergedById.get(row.id);
    if (looksTranslated(row.name, officialName)) {
      newCsvRows.push(row);
      seen.add(row.id);
    } else if (merged && looksTranslated(merged.name, officialName)) {
      newCsvRows.push({
        id: merged.id,
        name: merged.name,
        ability: merged.ability || "",
        firstNightReminder: merged.firstNightReminder || "",
        otherNightReminder: merged.otherNightReminder || "",
        reminders: (merged.reminders || []).join("|"),
        remindersGlobal: (merged.remindersGlobal || []).join("|")
      });
      seen.add(merged.id);
    }
  }
  for (const role of [...roles, ...fabled, ...loric]) {
    if (seen.has(role.id)) continue;
    const officialName = officialNameById.get(role.id);
    if (looksTranslated(role.name, officialName)) {
      newCsvRows.push({
        id: role.id,
        name: role.name,
        ability: role.ability || "",
        firstNightReminder: role.firstNightReminder || "",
        otherNightReminder: role.otherNightReminder || "",
        reminders: (role.reminders || []).join("|"),
        remindersGlobal: (role.remindersGlobal || []).join("|")
      });
      seen.add(role.id);
    }
  }

  fs.writeFileSync(
    path.join(ROOT, "src", "roles.json"),
    JSON.stringify(roles, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(ROOT, "src", "fabled.json"),
    JSON.stringify(fabled, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(ROOT, "src", "loric.json"),
    JSON.stringify(loric, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(ROOT, "src", "hatred.json"),
    JSON.stringify(hatred, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(ROOT, "src", "roles.zh_TW.json"),
    JSON.stringify(localeOverlay, null, 2) + "\n"
  );
  fs.writeFileSync(
    csvPath,
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
      "\n"
  );

  // Icon fallbacks (no network): copy team generics for missing ids
  const iconsDir = path.join(ROOT, "src", "assets", "icons");
  const teamIcon = {
    townsfolk: "good",
    outsider: "outsider",
    minion: "minion",
    demon: "evil",
    traveler: "traveler",
    fabled: "fabled",
    loric: "fabled"
  };
  if (!fs.existsSync(path.join(iconsDir, "traveler.png"))) {
    fs.copyFileSync(
      path.join(iconsDir, "custom.png"),
      path.join(iconsDir, "traveler.png")
    );
  }
  if (!fs.existsSync(path.join(iconsDir, "loric.png"))) {
    fs.copyFileSync(
      path.join(iconsDir, "fabled.png"),
      path.join(iconsDir, "loric.png")
    );
  }
  let icons = 0;
  for (const role of [...roles, ...fabled, ...loric]) {
    const dest = path.join(iconsDir, `${role.id}.png`);
    if (fs.existsSync(dest)) continue;
    const alt = teamIcon[role.team] || "custom";
    fs.copyFileSync(path.join(iconsDir, `${alt}.png`), dest);
    icons++;
  }

  console.log(
    `OK roles=${roles.length} fabled=${fabled.length} loric=${loric.length} jinxes=${hatred.length} iconFallbacks=${icons}`
  );
}

main();
