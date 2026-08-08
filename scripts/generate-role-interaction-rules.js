#!/usr/bin/env node
/**
 * Generate src/store/roleInteractionRules.json from community spreadsheet CSV
 * + roles.json night order + roleInputConfig patterns.
 *
 * Source sheet:
 * https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985
 *
 * Usage: npm run generate:interaction-rules
 */
const fs = require("fs");
const path = require("path");
const { TEAM_CATEGORY_OPTIONS, normalizeTeamTerms } = require("./team-terms");

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data/raw/community_translations_preview.csv");
const ROLES_PATH = path.join(ROOT, "src/roles.json");
const OUT_PATH = path.join(ROOT, "src/store/roleInteractionRules.json");

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985";

// --- CSV parser (minimal) ---
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

// --- roleInputConfig (mirrored for Node) ---
function isRole(role, ids, names = []) {
  const id = (role.baseRoleId || role.id || "").toLowerCase();
  const name = role.name || "";
  return ids.includes(id) || names.some((n) => name.includes(n));
}

function getRoleInputConfig(role) {
  if (!role || !role.id) return [];

  if (isRole(role, ["yinyangshi"], ["陰陽師", "阴阳师"])) {
    return [
      { key: "r1", type: "role", label: "善良角色 1" },
      { key: "r2", type: "role", label: "善良角色 2" },
      { key: "r3", type: "role", label: "邪惡角色 1" },
      { key: "r4", type: "role", label: "邪惡角色 2" },
    ];
  }

  if (
    isRole(role, ["washerwoman", "librarian", "investigator"], [
      "洗衣婦",
      "圖書管理員",
      "圖書館員",
      "調查員",
    ])
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      { key: "r1", type: "role", label: "對應角色" },
    ];
  }

  if (isRole(role, ["dreamer"], ["築夢師", "筑梦师"])) {
    return [
      { key: "p1", type: "otherPlayer", label: "目標玩家" },
      { key: "r1", type: "role", label: "善良角色" },
      { key: "r2", type: "role", label: "邪惡角色" },
    ];
  }

  if (
    isRole(
      role,
      ["cerenovus", "pit-hag", "kazali", "grandmother", "widow", "puzzlemaster", "jiaohuazi"],
      ["洗腦師", "麻臉巫婆", "卡扎力", "祖母", "寡婦", "解謎大師", "叫花子"],
    )
  ) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      { key: "r1", type: "role", label: "對應角色" },
    ];
  }

  if (
    isRole(
      role,
      ["chef", "empath", "mathematician", "shiguan", "fangshi", "clockmaker", "oracle", "juggler", "dagengren", "chambermaid"],
      ["廚師", "共情者", "數學家", "史官", "方士", "鐘錶匠", "神諭者", "雜耍藝人", "打更人", "侍女"],
    )
  ) {
    return [{ key: "num", type: "number", label: "得知數字" }];
  }

  if (isRole(role, ["balloonist"], ["氣球駕駛員"])) {
    return [
      { key: "target", type: "player", label: "標記玩家" },
      {
        key: "category",
        type: "select",
        label: "角色類別",
        options: TEAM_CATEGORY_OPTIONS,
      },
    ];
  }

  if (isRole(role, ["courtier"], ["侍臣"])) {
    return [
      { key: "target", type: "player", label: "醉酒玩家" },
      { key: "r1", type: "role", label: "選擇角色" },
    ];
  }

  if (isRole(role, ["fortune_teller", "seamstress"], ["占卜師", "女裁縫"])) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      { key: "res", type: "select", label: "結果判斷", options: ["是 (Yes)", "否 (No)"] },
    ];
  }

  if (isRole(role, ["noble"], ["貴族"])) {
    return [
      { key: "p1", type: "player", label: "善良玩家 1" },
      { key: "p2", type: "player", label: "善良玩家 2" },
      { key: "evilTarget", type: "player", label: "邪惡玩家" },
    ];
  }

  if (isRole(role, ["al-hadikhia", "alhadikhia", "dianyuzhang", "yinluren"], ["哈迪寂亞", "典獄長", "引路人"])) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      { key: "p3", type: "player", label: "玩家 3" },
    ];
  }

  if (
    isRole(
      role,
      ["shabaloth", "harpy", "qianke", "evil_twin", "eviltwin", "dianxiaoer", "knight", "baojun", "innkeeper", "barber", "xuncha", "jianning"],
      ["沙巴洛斯", "鷹身女妖", "掮客", "鏡像雙子", "店小二", "騎士", "暴君", "旅店老闆", "理髮師", "巡察", "奸佞"],
    )
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
    ];
  }

  if (isRole(role, ["qintianjian", "fengshuishi", "shugenja", "gudiao"], ["欽天監", "風水師", "修行者", "蠱雕"])) {
    return [{ key: "dir", type: "select", label: "方向", options: ["左/順時針", "右/逆時針", "相同"] }];
  }

  if (isRole(role, ["langzhong", "niangjiushi"], ["郎中", "釀酒師"])) {
    return [
      { key: "p1", type: "player", label: "目標對象" },
      { key: "word", type: "text", label: "給予提示詞/信息" },
    ];
  }

  if (isRole(role, ["zhen", "xionghaizi", "ojo", "courtier", "pixie", "alchemist", "daoke", "bianlianshi"], ["鴆", "熊孩子", "奧赫", "侍臣", "小精靈", "煉金術士", "刀客", "變臉師"])) {
    return [{ key: "r1", type: "role", label: "選擇角色" }];
  }

  if (isRole(role, ["village_idiot"], ["村夫"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      { key: "res", type: "select", label: "該玩家陣營", options: ["善良 (Good)", "邪惡 (Evil)"] },
    ];
  }

  if (isRole(role, ["general"], ["將軍"])) {
    return [{ key: "res", type: "select", label: "優勢陣營", options: ["善良", "邪惡", "均勢"] }];
  }

  if (isRole(role, ["mengpo"], ["孟婆"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      { key: "res", type: "select", label: "該玩家選擇", options: ["失去能力", "保留能力並死亡"] },
    ];
  }

  if (isRole(role, ["jinweijun2"], ["禁衛軍Ⅱ", "禁衛軍2"])) {
    return [{ key: "res", type: "select", label: "禁衛軍選擇", options: ["求生", "求死"] }];
  }

  if (isRole(role, ["organ_grinder"], ["街頭風琴手"])) {
    return [{ key: "res", type: "select", label: "是否醉酒", options: ["是 (醉酒)", "否 (清醒)"] }];
  }

  if (isRole(role, ["barista"], ["咖啡師"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      { key: "res", type: "select", label: "附加效果", options: ["解除醉酒中毒", "能力發動兩次"] },
    ];
  }

  if (isRole(role, ["mezepheles", "yaggababble", "savant", "artist", "wizard", "chongfei", "taotie"], ["靈言師", "牙噶巴卜", "博學者", "藝術家", "巫師", "寵妃", "饕餮"])) {
    return [{ key: "word", type: "text", label: "記錄詞語/短語/問題" }];
  }

  if (isRole(role, ["flowergirl", "town_crier", "zhifu", "yishi"], ["賣花女孩", "城鎮公告員", "知府", "驛使"])) {
    return [{ key: "res", type: "select", label: "結果", options: ["是 (Yes)", "否 (No)"] }];
  }

  if (
    isRole(
      role,
      ["banshee", "soldier", "mayor", "drunk", "saint", "recluse", "scarlet_woman", "scarletwoman", "baron", "mastermind", "deviant", "butcher", "atheist", "cannibal", "snitch", "damsel", "heretic", "politician", "boomdandy", "marionette", "leviathan", "vizier", "beggar", "scapegoat", "mutant", "sweetheart"],
      ["報喪女妖", "士兵", "市長", "酒鬼", "聖徒", "陌客", "紅唇女郎", "男爵", "主謀", "無神論者", "食人族", "落難少女", "政客", "炸彈人", "利維坦", "維齊爾", "乞丐", "替罪羊"],
    )
  ) {
    return [];
  }

  if (isRole(role, ["monk"], ["僧侶"])) {
    return [{ key: "target", type: "otherPlayer", label: "目標對象" }];
  }

  if (isRole(role, ["poisoner"], ["投毒者"])) {
    return [{ key: "target", type: "player", label: "目標對象" }];
  }

  if (isRole(role, ["imp"], ["小惡魔"])) {
    return [{ key: "target", type: "player", label: "目標對象" }];
  }

  return [{ key: "target", type: "player", label: "目標對象" }];
}

function parseReminderList(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,|]/)
    .map((s) => normalizeTeamTerms(s.trim()))
    .filter(Boolean);
}

function playerInputKeys(inputs) {
  return inputs.filter((i) => ["player", "alivePlayer", "otherPlayer"].includes(i.type)).map((i) => i.key);
}

function whenNights(role) {
  const hasFirst = role.firstNight != null && role.firstNight > 0;
  const hasOther = role.otherNight != null && role.otherNight > 0;
  if (hasFirst && hasOther) return ["first", "other"];
  if (hasFirst) return ["first"];
  if (hasOther) return ["other"];
  return ["first", "other"];
}

function sentenceAction(role, inputs, ability, effects) {
  if (inputs.some((i) => i.type === "number")) return "得知";
  if (/得知|你會得知|展示/.test(ability)) return "得知";
  if (isRole(role, ["spy"], ["間諜"])) return "查看魔典";

  const effectList = effects || [];
  if (
    /中毒/.test(ability) ||
    effectList.some((e) => e.type === "addReminder" && e.reminderName === "中毒")
  ) {
    return "投毒";
  }
  if (effectList.some((e) => e.type === "setDead" && e.value !== false)) {
    return "殺害";
  }
  if (
    /保護/.test(ability) ||
    effectList.some((e) => e.type === "addReminder" && e.reminderName === "保護")
  ) {
    return "保護";
  }
  return "選擇";
}

function buildTemplate(inputs, ability) {
  if (inputs.length === 0) return "{actor} → {action}";
  const keys = inputs.map((i) => i.key);
  if (keys.includes("p1") && keys.includes("p2") && keys.includes("r1")) {
    return "{actor} → {action} → {p1} & {p2} 其中一位是 {r1}";
  }
  if (keys.includes("p1") && keys.includes("p2") && keys.includes("res")) {
    return "{actor} → {action} → {p1} & {p2} → {res}";
  }
  if (keys.includes("p1") && keys.includes("p2") && keys.includes("p3")) {
    return "{actor} → {action} → {p1} & {p2} & {p3}";
  }
  if (keys.includes("p1") && keys.includes("p2")) {
    return "{actor} → {action} → {p1} & {p2}";
  }
  if (keys.includes("p1") && keys.includes("r1") && keys.includes("r2")) {
    return "{actor} → {action} → {p1} → {r1} / {r2}";
  }
  if (keys.includes("p1") && keys.includes("r1")) {
    return "{actor} → {action} → {p1} → {r1}";
  }
  if (keys.includes("target") && !/已死亡/.test(ability)) {
    const hint = ability.match(/(?<![已])死亡|中毒|保護|醉酒|瘋狂/);
    if (hint) {
      return `{actor} → {action} → 選擇 {target} → {target} ${hint[0]}`;
    }
  }
  if (keys.includes("target")) {
    return `{actor} → {action} → 選擇 {target}`;
  }
  if (keys.includes("num")) return "{actor} → {action} → {num}";
  if (keys.includes("word")) return "{actor} → {action} → {word}";
  if (keys.includes("res") && keys.length === 1) return "{actor} → {action} → {res}";
  return `{actor} → {action} → ${keys.map((k) => `{${k}}`).join(" / ")}`;
}

const SKIP_REMINDER = new Set([
  "無能力",
  "?",
  "已發生",
  "已聲明",
  "已猜測",
  "不能提名",
  "Hat",
  "哇喔",
  "不正確",
  "訪客",
  "摯友",
  "雙胞胎",
  "已選擇",
]);

/** Manual overrides — inputs/sentence only; effects come from buildEffects */
const SPECIAL_RULES = {
  spy: {
    inputs: [{ key: "note", type: "text", label: "備註（可留空）" }],
    sentence: { action: "查看魔典", template: "{actor} → {action}" },
    effects: [],
    notes: "每夜查看魔典；勿預設 └ 醉酒/中毒",
  },
  ravenkeeper: {
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "target", type: "player", label: "守鴉人選擇" }],
    sentence: { action: "得知", template: "{actor} → 死亡後得知 {target}" },
    effects: [],
    notes: "觸發：該角色今晚死亡才醒來；可選紀錄",
  },
  undertaker: {
    inputs: [{ key: "r1", type: "role", label: "處決角色" }],
    sentence: { action: "得知", template: "{actor} → {action} → 今日處決 {r1}" },
    effects: [],
    notes: "次夜起；當天有人死於處決才有資訊；勿 └ 自身處決",
  },
  scarletwoman: {
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "r1", type: "role", label: "惡魔角色" }],
    sentence: { action: "成為", template: "{actor}成為[{r1}]" },
    effects: [
      {
        type: "addReminder",
        targetFrom: "actor",
        reminderName: "是惡魔",
        reminderRole: "scarletwoman",
        optional: true,
        defaultOn: true,
        label: "自身 是惡魔",
      },
    ],
    notes: "觸發：≥5 存活時惡魔死亡；非夜選擇；可選紀錄",
  },
  drunk: {
    activation: "setup",
    once: true,
    when: { nights: [] },
    inputs: [
      { key: "p1", type: "player", label: "酒鬼玩家" },
      { key: "r1", type: "role", label: "善良角色" },
    ],
    sentence: { action: "是", template: "{p1}是[酒鬼]" },
    effects: [
      { type: "setRole", targetFrom: "p1", roleFrom: "r1" },
      {
        type: "addReminder",
        targetFrom: "p1",
        reminderName: "是酒鬼",
        reminderRole: "drunk",
        optional: true,
        defaultOn: true,
        label: "掛 是酒鬼 標記",
      },
    ],
    notes: "設置 A：已指派酒鬼時，將角色改為所选善良角色並掛「是酒鬼」；B：未指派且無標記時選善良玩家僅掛標記",
  },
  marionette: {
    activation: "setup",
    once: true,
    when: { nights: [] },
    inputs: [
      { key: "p1", type: "player", label: "提線木偶玩家" },
      { key: "r1", type: "role", label: "善良角色" },
    ],
    sentence: { action: "是", template: "{p1}是[提線木偶]" },
    effects: [
      { type: "setRole", targetFrom: "p1", roleFrom: "r1" },
      {
        type: "addReminder",
        targetFrom: "p1",
        reminderName: "是提線木偶",
        reminderRole: "marionette",
        optional: true,
        defaultOn: true,
        label: "掛 是提線木偶 標記",
      },
    ],
    notes: "設置 A：已指派提線木偶時，將角色改為所选善良角色並掛「是提線木偶」；B：未指派且無標記時選善良玩家僅掛標記",
  },
  fortuneteller: {
    inputs: [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      {
        key: "res",
        type: "select",
        label: "結果判斷",
        options: ["是", "否"],
      },
    ],
    sentence: {
      action: "得知",
      template: "{actor} → 查驗 {p1} & {p2} → {res}",
    },
    effects: [],
    notes:
      "res 用 是/否；「始終將…視為惡魔」僅開局一次（另記／可選紀錄）",
  },
};

function applySpecialRule(rule) {
  const special = SPECIAL_RULES[rule.id && rule.id.toLowerCase()];
  if (!special) return rule;
  const merged = { ...rule, ...special };
  if (!Object.prototype.hasOwnProperty.call(special, "effects")) {
    merged.effects = rule.effects;
  }
  return merged;
}

function targetLabel(targetFrom, inputs) {
  if (targetFrom === "actor") return "自身";
  const input = (inputs || []).find((i) => i.key === targetFrom);
  return (input && input.label) || targetFrom;
}

function buildReminderMappings(id, reminders, inputs) {
  const players = playerInputKeys(inputs);
  const mappings = [];

  const push = (token, targetFrom, opts = {}) => {
    if (!token || SKIP_REMINDER.has(token)) return;
    mappings.push({ token, targetFrom, ...opts });
  };

  if (["washerwoman", "librarian", "investigator"].includes(id) && reminders.length >= 2) {
    push(reminders[0], "p1", { optional: false, defaultOn: true });
    push(reminders[1], "p2", { optional: false, defaultOn: true });
    return mappings;
  }

  if (id === "balloonist") {
    reminders.forEach((token) => {
      push(token, "target", { optional: true, defaultOn: false, label: `標記 ${token}` });
    });
    return mappings;
  }

  if (id === "courtier") {
    reminders
      .filter((r) => r !== "無能力")
      .forEach((token, idx) => {
        push(token, "target", {
          optional: true,
          defaultOn: idx === 0,
          label: `醉酒標記 ${token}`,
        });
      });
    return mappings;
  }

  if (id === "alhadikhia" || id === "al-hadikhia") {
    reminders.forEach((token) => {
      if (/^[123]$/.test(token)) {
        push(token, `p${token}`, { optional: false, defaultOn: true });
      } else {
        push(token, "p1", { optional: true, defaultOn: false });
      }
    });
    return mappings;
  }

  if (id === "godfather") {
    return mappings;
  }

  if (id === "legion") {
    push("即將處決", "target", { optional: true, defaultOn: true, label: "即將處決" });
    push("死亡", "target", { optional: true, defaultOn: false, label: "死亡" });
    return mappings;
  }

  if (id === "drunk" || id === "goon") {
    const token = id === "drunk" ? "是酒鬼" : reminders[0] || "醉酒";
    push(token, "actor", { optional: true, defaultOn: true });
    return mappings;
  }

  if (id === "bishop") {
    reminders.forEach((token, idx) => {
      push(token, "actor", { optional: true, defaultOn: idx === 0 });
    });
    return mappings;
  }

  if (id === "hermit") {
    reminders.forEach((token, idx) => {
      push(token, "actor", { optional: true, defaultOn: idx === 0, label: `能力 ${token}` });
    });
    return mappings;
  }

  if (id === "cannibal") {
    push("中毒", "actor", { optional: true, defaultOn: false, label: "自身中毒" });
    push("最後被處死", "actor", { optional: true, defaultOn: false, label: "最後被處死（參考）" });
    return mappings;
  }

  if (id === "minstrel" || id === "tealady") {
    reminders.forEach((token, idx) => {
      push(token, "actor", { optional: true, defaultOn: idx === 0 });
    });
    return mappings;
  }

  if (id === "puzzlemaster") {
    push("醉酒", "p1", { optional: true, defaultOn: true, label: "醉酒玩家標記" });
    return mappings;
  }

  if (id === "flowergirl" || id === "towncrier") {
    reminders.forEach((token, idx) => {
      push(token, "actor", { optional: true, defaultOn: idx === 0 });
    });
    return mappings;
  }

  if (id === "mengpo") {
    return mappings;
  }

  if (players.length >= reminders.length && reminders.length > 1) {
    reminders.forEach((token, i) => {
      push(token, players[i], { optional: false, defaultOn: true });
    });
    return mappings;
  }

  if (players.length === 1 && reminders.length > 1) {
    reminders.forEach((token, idx) => {
      push(token, players[0], {
        optional: true,
        defaultOn: idx === 0,
      });
    });
    return mappings;
  }

  if (players.length >= 1 && reminders.length === 1) {
    push(reminders[0], players[0], { optional: true, defaultOn: true });
    return mappings;
  }

  if (players.length === 0 && reminders.length) {
    reminders.forEach((token, idx) => {
      push(token, "actor", { optional: true, defaultOn: idx === 0 });
    });
    return mappings;
  }

  if (players.length && reminders.length) {
    reminders.forEach((token, i) => {
      push(token, players[i % players.length], {
        optional: true,
        defaultOn: i === 0,
      });
    });
  }

  return mappings;
}

function buildEffects(role, csvRow, inputs) {
  const id = role.id.toLowerCase();
  const ability = (csvRow && csvRow.ability) || role.ability || "";
  const reminders = collectReminders(role, csvRow);

  const players = playerInputKeys(inputs);
  const primary = players[0] || "target";
  const effects = [];

  const isNightKill =
    /選擇.*(玩家|一名).*死亡|該玩家死亡|他死亡|她死亡/.test(ability) &&
    (/每個夜晚\*|每天晚上\*|晚上時\*|每晚\*|夜晚\*/.test(ability) ||
      (role.team === "demon" && id !== "legion"));

  if (isNightKill && players.length) {
    effects.push({
      id: "kill",
      type: "setDead",
      targetFrom: primary,
      value: true,
      optional: true,
      defaultOn: true,
      label: "目標死亡",
    });
  }

  if (id === "mengpo") {
    effects.push({
      id: "kill",
      type: "setDead",
      targetFrom: "p1",
      optional: true,
      defaultOn: false,
      label: "目標死亡",
    });
    effects.push({
      type: "setAbilityLost",
      targetFrom: "p1",
      optional: true,
      defaultOn: false,
      label: "目標失去能力",
    });
  }

  const mappings = buildReminderMappings(id, reminders, inputs);
  const hasKill = effects.some((e) => e.id === "kill");

  mappings.forEach(({ token, targetFrom, optional, defaultOn, label }) => {
    if (token === "死亡" && hasKill) {
      effects.push({
        type: "addReminder",
        targetFrom: primary,
        reminderName: token,
        reminderRole: id,
        bindTo: "kill",
        label: "目標掛死亡標記",
      });
      return;
    }
    if (token === "死亡" && hasKill) return;

    effects.push({
      type: "addReminder",
      targetFrom,
      reminderName: token,
      reminderRole: id,
      optional: optional !== false,
      defaultOn: defaultOn !== false,
      label: label || `${targetLabel(targetFrom, inputs)} ${token}`,
    });
  });

  // 咖啡師（試算表 tokens）
  if (id === "barista" && !effects.length) {
    ["清醒&健康", "能力x2"].forEach((token, idx) => {
      effects.push({
        type: "addReminder",
        targetFrom: "p1",
        reminderName: token,
        reminderRole: id,
        optional: true,
        defaultOn: idx === 0,
        label: token,
      });
    });
  }

  return effects;
}

function collectReminders(role, csvRow) {
  return [
    ...parseReminderList(csvRow && csvRow.reminders),
    ...parseReminderList(csvRow && csvRow.remindersGlobal),
    ...(role.reminders || []),
    ...(role.remindersGlobal || []),
  ]
    .filter((r, i, arr) => arr.indexOf(r) === i)
    .filter((r) => !SKIP_REMINDER.has(r));
}

function buildRule(role, csvRow) {
  let inputs = getRoleInputConfig(role);
  const special = SPECIAL_RULES[role.id && role.id.toLowerCase()];
  if (special && special.inputs) {
    inputs = special.inputs;
  }
  const ability = (csvRow && csvRow.ability) || role.ability || "";
  const name = (csvRow && csvRow.name) || role.name || role.id;
  const hasNight =
    (role.firstNight != null && role.firstNight > 0) ||
    (role.otherNight != null && role.otherNight > 0);
  const hasReminders = collectReminders(role, csvRow).length > 0;

  if (!hasNight && !hasReminders) return null;

  const effects = buildEffects(role, csvRow, inputs);
  const rule = {
    id: role.id,
    name,
    enabled: true,
    when: { nights: hasNight ? whenNights(role) : ["first", "other"] },
    inputs,
    sentence: {
      action: sentenceAction(role, inputs, ability, effects),
      template: buildTemplate(inputs, ability),
    },
    effects,
    notes: hasNight
      ? inputs.length
        ? `sheet:${SHEET_URL}`
        : "passive — 試算表/被動，無輸入卡"
      : "passive — 無夜動喚醒，標記由說書人手動套用",
  };

  if (inputs.length === 0 && hasNight) {
    rule.notes = rule.notes || "passive — 無夜動輸入卡";
  }

  return applySpecialRule(rule);
}

function main() {
  const csvMap = loadCsvMap();
  const roles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
  const rules = [];

  roles.forEach((role) => {
    if (!role.id) return;
    const csvRow = csvMap.get(role.id.toLowerCase());
    const rule = buildRule(role, csvRow);
    if (rule) rules.push(rule);
  });

  rules.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, "zh"));

  const out = {
    version: 1,
    source: SHEET_URL,
    generatedAt: new Date().toISOString(),
    rules,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  const withEffects = rules.filter((r) => r.effects && r.effects.length).length;
  const withInputs = rules.filter((r) => r.inputs && r.inputs.length).length;
  const passive = rules.filter((r) => !r.inputs || !r.inputs.length).length;

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Rules: ${rules.length} total, ${withInputs} with inputs, ${withEffects} with effects, ${passive} passive`);
}

main();
