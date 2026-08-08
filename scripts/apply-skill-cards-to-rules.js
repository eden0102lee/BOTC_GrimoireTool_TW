/**
 * Apply official skill-card docs → roleInteractionRules.json (戰報互動).
 * Source of truth: docs/official-skill-cards-{tb,bmr,snv}.md
 *
 * Updates sentence.action / sentence.template / notes from cards,
 * plus structured effect/input fixes for known mismatches.
 *
 * Usage: node scripts/apply-skill-cards-to-rules.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RULES_PATH = path.join(ROOT, "src", "store", "roleInteractionRules.json");
const DOCS = ["tb", "bmr", "snv"].map((ed) =>
  path.join(ROOT, "docs", `official-skill-cards-${ed}.md`),
);

function parseSkillCards(md) {
  const cards = new Map();
  const parts = md.split(/^### /m).slice(1);
  for (const part of parts) {
    const head = part.match(/^([a-z0-9]+)\s*\|\s*([^\n]+)/i);
    if (!head) continue;
    const id = head[1].toLowerCase();
    const name = head[2].trim();
    const field = (key) => {
      const m = part.match(new RegExp(`^- ${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };
    const templateRaw = field("template").replace(/^`|`$/g, "");
    const verb = field("動詞");
    const notes = field("備註");
    const timing = field("時機");
    const exampleMatch = part.match(/```\n([\s\S]*?)\n```/);
    cards.set(id, {
      id,
      name,
      verb,
      template: templateRaw,
      notes,
      timing,
      example: exampleMatch ? exampleMatch[1].trim() : "",
      effectsLabel: field("effects"),
      inputsLabel: field("輸入"),
    });
  }
  return cards;
}

function rem(roleId, name, targetFrom, opts = {}) {
  return {
    type: "addReminder",
    targetFrom,
    reminderName: name,
    reminderRole: roleId,
    optional: opts.optional !== false,
    defaultOn: opts.defaultOn !== false,
    label: opts.label || `${targetFrom === "actor" ? "自身" : "目標"} ${name}`,
    ...(opts.bindTo ? { bindTo: opts.bindTo } : {}),
    ...(opts.id ? { id: opts.id } : {}),
  };
}

function logLine(targetFrom, text, opts = {}) {
  return {
    type: "logLine",
    targetFrom,
    text,
    optional: opts.optional !== false,
    defaultOn: opts.defaultOn !== false,
    label: opts.label || text,
  };
}

function kill(roleId, targetFrom = "target", opts = {}) {
  const id = opts.id || "kill";
  return [
    {
      id,
      type: "setDead",
      targetFrom,
      value: true,
      optional: opts.optional !== false,
      defaultOn: opts.defaultOn !== false,
      label: opts.label || (targetFrom === "actor" ? "自身死亡" : "目標死亡"),
    },
    rem(roleId, "死亡", targetFrom, {
      bindTo: id,
      label: targetFrom === "actor" ? "自身掛死亡標記" : "目標掛死亡標記",
    }),
  ];
}

/** Structured patches keyed by role id (overrides MD parse for effects/inputs).
 * Player input types (player/alivePlayer/otherPlayer) are owned by
 * scripts/apply-target-input-types.js — keep STRUCTURAL in sync when listing inputs.
 */
const STRUCTURAL = {
  assassin: {
    once: true,
    sentence: {
      action: "刺殺",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "無視「不會死」；每局一次",
  },
  gambler: {
    inputs: [
      { key: "target", type: "alivePlayer", label: "目標對象" },
      { key: "r1", type: "role", label: "猜測角色" },
    ],
    sentence: {
      action: "猜測",
      template: "{actor} → {action} → {target} 是 [{r1}]",
    },
    effects: kill("gambler", "actor", {
      label: "自身死亡（猜錯）",
      defaultOn: true,
    }),
    notes: "猜錯時賭徒死亡；猜對可關 effect",
  },
  professor: {
    once: true,
    sentence: {
      action: "復活",
      template: "{actor} → {action} → 選擇 {target} → {target} 復活",
    },
    effects: [
      {
        id: "revive",
        type: "setRevive",
        targetFrom: "target",
        optional: true,
        defaultOn: true,
        label: "目標對象 復活",
      },
      rem("professor", "復活", "target", {
        bindTo: "revive",
        label: "目標對象 復活標記",
        defaultOn: false,
      }),
    ],
    notes: "目標須為死亡鎮民；非鎮民則無效",
  },
  tealady: {
    activation: "optional",
    when: { nights: [] },
    inputs: [],
    sentence: { action: "", template: "{actor}茶藝師保護鄰居" },
    effects: [
      rem("tealady", "不會死", "actor", {
        label: "（記錄用）不會死／鄰居保護",
        defaultOn: false,
      }),
    ],
    notes: "被動；兩側存活鄰居皆善良時他們不會死；標記由說書人手動",
  },
  goon: {
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "target", type: "player", label: "玩家" }],
    sentence: {
      action: "被選擇",
      template: "{actor} 被 {target} 選擇",
    },
    effects: [
      rem("goon", "醉酒", "target", { optional: false, label: "玩家 醉酒" }),
      {
        type: "setAlignment",
        targetFrom: "actor",
        alignmentFrom: "target",
        optional: true,
        defaultOn: true,
        label: "莽夫 轉變為[陣營]",
      },
    ],
    notes: "被動；選中者醉酒，莽夫轉為其陣營",
  },
  chambermaid: {
    inputs: [
      { key: "p1", type: "otherPlayer", label: "玩家 1" },
      { key: "p2", type: "otherPlayer", label: "玩家 2" },
      { key: "num", type: "number", label: "醒來人數 0/1/2" },
    ],
    sentence: {
      action: "得知",
      template:
        "{actor} → {action} → {p1} & {p2} 中有 [{num}] 位因自身能力醒來",
    },
    effects: [],
    notes: "選兩名存活他玩家；回 0/1/2",
  },
  tinker: {
    activation: "optional",
    inputs: [],
    sentence: { action: "", template: "{actor}死亡" },
    effects: kill("tinker", "actor", { label: "自身死亡" }),
    notes: "可無主動選擇；隨時可能死亡",
  },
  apprentice: {
    when: { nights: ["first"] },
    inputs: [{ key: "r1", type: "role", label: "獲得的能力角色" }],
    sentence: {
      action: "獲得",
      template: "{actor} → {action} → [{r1}] 能力",
    },
    notes: "善→鎮民能力／邪→爪牙能力；換代幣+標記",
  },
  nodashii: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "夜殺目標；setup 時對兩側最近鎮民掛中毒",
    activation: null,
  },
  sweetheart: {
    activation: "optional",
    inputs: [{ key: "p1", type: "player", label: "醉酒玩家" }],
    sentence: { action: "", template: "{actor}死亡 → {p1} 醉酒" },
    effects: [rem("sweetheart", "醉酒", "p1", { label: "目標玩家 醉酒" })],
    notes: "心上人死亡時一名玩家開始醉酒",
  },
  pithag: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → {p1} → {r1}",
    },
    effects: [
      {
        id: "become",
        type: "setRole",
        targetFrom: "p1",
        roleFrom: "r1",
        optional: true,
        defaultOn: true,
        label: "目標變成該角色（角色不在場）",
      },
      {
        id: "kill",
        type: "setDead",
        targetFrom: "p1",
        value: true,
        optional: true,
        defaultOn: false,
        label: "（若創造新惡魔）當晚死亡—說書人選",
      },
    ],
    notes:
      "角色不在場時目標變成該角色；若變出新惡魔，當晚死亡由說書人決定",
  },
  witch: {
    sentence: {
      action: "詛咒",
      template: "{actor} → {action} → 選擇 {target}",
    },
    effects: [rem("witch", "詛咒", "target", { label: "目標對象 詛咒" })],
    notes: "僅三人存活時失去能力；夜動掛詛咒，提名時用咒殺卡",
  },
  cerenovus: {
    sentence: {
      action: "洗腦",
      template: "{actor} → {action} → {p1} → {r1}",
    },
    notes: "說書人裁定；目標須瘋狂證明自己是該角色",
  },
  bonecollector: {
    once: true,
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → 選擇 {target}",
    },
    effects: [
      rem("bonecollector", "具有能力", "target", { label: "目標對象 具有能力" }),
    ],
    notes: "至明昏恢復能力；每局一次",
  },
  harlot: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → 選擇 {target}",
    },
    effects: [
      ...kill("harlot", "target", {
        defaultOn: false,
        label: "目標死亡（可選殉情）",
      }),
      ...kill("harlot", "actor", {
        id: "killSelf",
        defaultOn: false,
        label: "自身死亡（可選殉情）",
      }),
    ],
    notes: "不同意則無└；說書人可讓雙方死亡",
  },
  sage: {
    activation: "optional",
    inputs: [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
    ],
    sentence: {
      action: "得知",
      template: "{actor} → 死亡後得知 {p1} & {p2} 其中一位是惡魔",
    },
    effects: [],
    notes: "被惡魔殺死時得知兩名玩家之一為惡魔",
  },
  philosopher: {
    once: true,
    inputs: [
      { key: "r1", type: "role", label: "善良角色" },
      { key: "p1", type: "player", label: "在場則醉酒的玩家（可空）" },
    ],
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → [{r1}]",
    },
    effects: [
      rem("philosopher", "是哲學家", "actor", { label: "自身 是哲學家" }),
      rem("philosopher", "醉酒", "p1", {
        label: "在場角色玩家 醉酒",
        defaultOn: false,
      }),
    ],
    notes: "選善良角色；在場則對方醉酒；掛是哲學家標記",
  },
  innkeeper: {
    sentence: {
      action: "保護",
      template: "{actor} → {action} → {p1} & {p2}",
    },
    notes: "兩人皆保護；其中一人醉酒",
  },
  courtier: {
    once: true,
    inputs: [
      { key: "r1", type: "role", label: "選擇角色" },
      { key: "target", type: "player", label: "在場則醉酒的玩家（可空）" },
    ],
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → [{r1}] → {target} 醉酒",
    },
    notes: "先選角色；在場才掛醉酒 3 並逐日遞減",
  },
  exorcist: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → 選擇 {target}",
    },
    effects: [
      rem("exorcist", "已選擇", "target", {
        optional: false,
        label: "目標對象 已選擇",
      }),
      logLine("target", "得知驅魔人", {
        optional: true,
        defaultOn: false,
        label: "惡魔玩家 得知驅魔人",
      }),
    ],
    notes: "不可與昨晚同目標；命中惡魔才勾選得知",
  },
  godfather: {
    notes: "首夜自動帶入在場外來者；殺人僅在外來者白日死後（optional 卡），僅記錄殺害動作",
  },
  moonchild: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "目標善良才死；邪惡可關 effect",
  },
  gossip: {
    notes: "聲明正確才夜殺；夜裡由說書人選死者",
  },
  minstrel: {
    activation: "optional",
    inputs: [
      { key: "target", type: "player", label: "被處決的爪牙（可空）" },
    ],
    sentence: {
      action: "",
      template: "{target}被處決 → {actor}觸發全員醉酒",
    },
    notes: "白天觸發；除吟遊詩人與旅行者外全員醉酒至明天黃昏",
  },
  grandmother: {
    notes: "孫子被惡魔殺死 → 祖母死亡",
  },
  fanggu: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "一般夜殺；轉化用 convert 卡（每局一次）；開局 +1 外來者",
  },
  vigormortis: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "殺爪牙才開「具有能力」與鄰近中毒；開局 −1 外來者",
  },
  vortox: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
    },
    notes: "白天無處決 → 邪惡獲勝；鎮民資訊必錯",
  },
  snakecharmer: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → 選擇 {target}",
    },
    notes: "僅命中惡魔時交換（說書人手動換代幣）；新舞蛇人中毒",
  },
  barber: {
    notes: "標記掛在理髮師；不可選其他惡魔；換角由說書人手動",
  },
  eviltwin: {
    when: { nights: ["first"] },
    notes: "首夜互認；雙方掛雙胞胎；善側雙子處決→邪勝；雙方皆活時善不能勝",
  },
  towncrier: {
    notes: "得知爪牙今日是否提名",
  },
  flowergirl: {
    notes: "得知惡魔今日是否投票",
  },
  seamstress: {
    once: true,
    notes: "每局一次；得知兩人是否同陣營",
  },
  juggler: {
    once: true,
    notes: "首日公開猜；當晚回報猜對數",
  },
  dreamer: {
    notes: "一善一邪角色，其一正確",
  },
  clockmaker: {
    notes: "惡魔到最近爪牙距離（鄰座=1）",
  },
  mathematician: {
    notes: "今日能力異常作用的玩家人數",
  },
  oracle: {
    notes: "死亡玩家中邪惡數量",
  },
  lunatic: {
    activation: "setup",
    once: true,
    when: { nights: [] },
    inputs: [
      { key: "p1", type: "player", label: "瘋子玩家", teams: ["outsider"] },
      { key: "r1", type: "role", label: "惡魔角色", teams: ["demon"] },
    ],
    sentence: { action: "是", template: "{p1}是[瘋子]" },
    effects: [
      { type: "setRole", targetFrom: "p1", roleFrom: "r1" },
      {
        type: "addReminder",
        targetFrom: "p1",
        reminderName: "是瘋子",
        reminderRole: "lunatic",
        label: "掛 是瘋子 標記",
      },
    ],
    notes:
      "劇本含瘋子且（已指派瘋子字卡，或玩家已有「是瘋子」標記）時顯示；選惡魔角色並掛「是瘋子」",
  },
  po: {
    notes: "跳過後隔晚必須三殺；攻擊x3 掛在珀自身",
  },
  barista: {
    sentence: {
      action: "選擇",
      template: "{actor} → {action} → {p1} → {res}",
    },
    notes: "說書人二選一；該玩家會得知是哪個效果",
  },
  pukka: {
    sentence: {
      action: "投毒",
      template: "{actor} → {action} → 選擇 {target} → {target} 中毒",
    },
    notes: "新選中毒；上夜中毒者今晚死亡（首夜通常無 prev）",
  },
  shabaloth: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → {p1} & {p2}",
    },
    notes: "殺兩人；可能反芻上夜選過且當前死亡者之一",
  },
  zombuul: {
    sentence: {
      action: "殺害",
      template: "{actor} → {action} → 選擇 {target}",
    },
    notes: "僅當日無人死亡才可夜殺（optional）；第一次死亡不真正死（視為已死）",
  },
  sailor: {
    notes: "你或目標之一醉酒；水手不會死（被動）",
  },
  devilsadvocate: {
    notes: "不可與昨晚同目標",
  },
  // --- TB structural patches (was apply-tb-skill-cards-to-rules.js) ---
  scarletwoman: {
    name: "紅唇女郎",
    activation: "optional",
    once: false,
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
    notes: "觸發：≥5 名玩家存活（不含旅行者）時惡魔死亡；非夜選擇；可選紀錄",
  },
  spy: {
    effects: [],
    sentence: { action: "查看魔典", template: "{actor} → {action}" },
    notes: "每夜查看魔典；勿預設 └ 醉酒/中毒",
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
  baron: {
    activation: "setup",
    once: true,
    when: { nights: [] },
    inputs: [],
    sentence: { action: "", template: "本局外來者人數為 {n} +2" },
    effects: [],
    notes: "開局紀錄即可；本局外來者 +2",
  },
  ravenkeeper: {
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "target", type: "player", label: "守鴉人選擇" }],
    sentence: {
      action: "得知",
      template: "{actor} → 死亡後得知 {target}",
    },
    effects: [],
    notes: "觸發：該角色今晚死亡才醒來；可選紀錄",
  },
  undertaker: {
    effects: [],
    sentence: {
      action: "得知",
      template: "{actor} → {action} → 今日處決 {r1}",
    },
    notes: "次夜起；當天有人死於處決才有資訊；勿 └ 自身處決",
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
      "res 用 是/否；「始終將…視為惡魔」僅開局一次（另記／可選紀錄），勿每夜掛標記",
  },
  imp: {
    inputs: [{ key: "target", type: "player", label: "目標對象" }],
    notes:
      "主線：殺害目標。自殺轉生（爪牙成為小惡魔）另條／可選紀錄；可選 effect 關閉時無 └",
  },
  poisoner: {
    inputs: [{ key: "target", type: "player", label: "目標對象" }],
    sentence: {
      action: "投毒",
      template: "{actor} → {action} → 選擇 {target} → {target} 中毒",
    },
  },
  monk: {
    inputs: [{ key: "target", type: "otherPlayer", label: "目標對象" }],
    sentence: {
      action: "保護",
      template: "{actor} → {action} → 選擇 {target}",
    },
  },
};

const NEW_RULES = [
  {
    id: "judge",
    name: "法官",
    enabled: true,
    activation: "optional",
    once: true,
    when: { nights: [] },
    inputs: [
      {
        key: "res",
        type: "select",
        label: "裁定",
        options: ["成功", "失敗"],
      },
    ],
    sentence: { action: "裁定", template: "{actor} → {action} → 本次處決 [{res}]" },
    effects: [],
    notes: "他玩家提名時，可強制處決成功或失敗（每局一次）",
  },
  {
    id: "fool",
    name: "弄臣",
    enabled: true,
    activation: "optional",
    once: true,
    when: { nights: [] },
    inputs: [],
    sentence: { action: "", template: "{actor}第一次死亡 → 倖免" },
    effects: [
      rem("fool", "無能力", "actor", { label: "自身 無能力／失去能力" }),
    ],
    notes: "第一次死亡時不會死；之後掛無能力",
  },
  {
    id: "pacifist",
    name: "和平主義者",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "target", type: "player", label: "倖免的玩家" }],
    sentence: {
      action: "",
      template: "{target}被處決 → {actor}：倖免",
    },
    effects: [],
    notes: "被動／說書人裁定；善良玩家被處決時可能不死",
  },
  {
    id: "mastermind",
    name: "主謀",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [
      { key: "target", type: "player", label: "翌日被處決的玩家（可空）" },
      {
        key: "align",
        type: "select",
        label: "落敗陣營",
        options: ["善良", "邪惡"],
      },
    ],
    sentence: {
      action: "",
      template: "主謀生效；{target}被處決 → [{align}]陣營落敗",
    },
    effects: [],
    notes: "惡魔被處決後遊戲多一日；再有人處決則其陣營敗",
  },
  {
    id: "artist",
    name: "藝術家",
    enabled: true,
    activation: "optional",
    once: true,
    when: { nights: [] },
    inputs: [
      {
        key: "res",
        type: "select",
        label: "答案",
        options: ["是", "否"],
      },
    ],
    sentence: {
      action: "詢問",
      template: "{actor} → {action} → 說書人 [{res}]",
    },
    effects: [],
    notes: "白天私下問是非題（每局一次）",
  },
  {
    id: "savant",
    name: "博學者",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [
      { key: "note", type: "text", label: "兩條資訊（一真一假）" },
    ],
    sentence: {
      action: "得知",
      template: "{actor} → {action} → 兩條資訊",
    },
    effects: [],
    notes: "白天私下；通常不寫結構化戰報",
  },
  {
    id: "klutz",
    name: "呆瓜",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [
      { key: "target", type: "alivePlayer", label: "選擇的存活玩家" },
      {
        key: "align",
        type: "select",
        label: "落敗陣營（若目標邪惡）",
        options: ["善良", "邪惡"],
      },
    ],
    sentence: {
      action: "選擇",
      template: "{actor}死亡時選擇 {target}",
    },
    effects: [],
    notes: "若目標邪惡則己方陣營敗；可選紀錄",
    sentenceFixed: null,
  },
  {
    id: "matron",
    name: "女舍監",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "note", type: "text", label: "互換座位說明" }],
    sentence: { action: "", template: "{actor}互換座位：{note}" },
    effects: [],
    notes: "白天可換至多三對座位；不可離座密談",
  },
  {
    id: "butcher",
    name: "屠夫",
    enabled: true,
    activation: "optional",
    when: { nights: [] },
    inputs: [{ key: "target", type: "alivePlayer", label: "追加提名目標" }],
    sentence: {
      action: "追加提名",
      template: "{actor} → {action} → {target}",
    },
    effects: [],
    notes: "白天首次處決後可再提名一人",
  },
  // --- TB optional/trigger rules (was apply-tb-skill-cards-to-rules.js) ---
  {
    id: "slayer",
    name: "獵手",
    enabled: true,
    activation: "optional",
    once: true,
    when: { nights: [] },
    inputs: [{ key: "target", type: "alivePlayer", label: "目標對象" }],
    sentence: {
      action: "獵殺",
      template: "{actor} → {action} → {target}",
    },
    effects: [
      {
        id: "kill",
        type: "setDead",
        targetFrom: "target",
        value: true,
        optional: true,
        defaultOn: true,
        label: "目標死亡",
      },
      {
        type: "addReminder",
        targetFrom: "target",
        reminderName: "死亡",
        reminderRole: "slayer",
        bindTo: "kill",
        label: "目標掛死亡標記",
      },
    ],
    notes: "白天公開使用，每局一次；目標為惡魔才死亡；可選紀錄",
  },
  {
    id: "gunslinger",
    name: "槍手",
    enabled: true,
    activation: "optional",
    once: false,
    when: { nights: [] },
    inputs: [{ key: "target", type: "alivePlayer", label: "目標對象" }],
    sentence: {
      action: "槍殺",
      template: "{actor} → {action} → {target}",
    },
    effects: [
      {
        id: "kill",
        type: "setDead",
        targetFrom: "target",
        value: true,
        optional: true,
        defaultOn: true,
        label: "目標死亡",
      },
      {
        type: "addReminder",
        targetFrom: "target",
        reminderName: "死亡",
        reminderRole: "gunslinger",
        bindTo: "kill",
        label: "目標掛死亡標記",
      },
    ],
    notes: "白天首次投票統計後可選一名剛投票者；可選紀錄",
  },
  {
    id: "soldier",
    name: "士兵",
    enabled: true,
    activation: "optional",
    once: false,
    when: { nights: [] },
    inputs: [{ key: "target", type: "player", label: "士兵" }],
    sentence: {
      action: "",
      template: "惡魔選擇了 {target}",
      fixedResults: ["無效"],
    },
    effects: [],
    notes: "被動：惡魔負面能力落在士兵上時記錄；可選紀錄",
  },
  {
    id: "virgin",
    name: "貞潔者",
    enabled: true,
    activation: "optional",
    once: true,
    when: { nights: [] },
    inputs: [{ key: "nominator", type: "alivePlayer", label: "提名者" }],
    sentence: {
      action: "提名",
      template: "{nominator}提名 {actor}",
    },
    effects: [
      {
        id: "kill",
        type: "setDead",
        targetFrom: "nominator",
        value: true,
        optional: true,
        defaultOn: true,
        label: "提名者被處決死亡",
      },
      {
        type: "addReminder",
        targetFrom: "nominator",
        reminderName: "死亡",
        reminderRole: "virgin",
        bindTo: "kill",
        label: "提名者掛死亡標記",
      },
    ],
    notes: "首次被提名且提名者為鎮民 → 提名者立刻處決；可選紀錄",
  },
  {
    id: "saint",
    name: "聖徒",
    enabled: true,
    activation: "optional",
    once: false,
    when: { nights: [] },
    inputs: [
      {
        key: "align",
        type: "select",
        label: "陣營",
        options: ["善良", "邪惡"],
      },
    ],
    sentence: {
      action: "",
      template: "{actor}死於處決，[{align}]陣營落敗",
    },
    effects: [],
    notes: "死於處決 → 所屬陣營落敗；可選紀錄",
  },
  {
    id: "mayor",
    name: "鎮長",
    enabled: true,
    activation: "optional",
    once: false,
    when: { nights: [] },
    inputs: [
      {
        key: "scenario",
        type: "select",
        label: "情境",
        options: ["三人獲勝", "代死"],
      },
      {
        key: "align",
        type: "select",
        label: "陣營",
        options: ["善良", "邪惡"],
      },
      { key: "target", type: "otherPlayer", label: "代替死亡玩家" },
    ],
    sentence: {
      action: "",
      template: "{actor}鎮長情境",
    },
    effects: [
      {
        id: "kill",
        type: "setDead",
        targetFrom: "target",
        value: true,
        optional: true,
        defaultOn: false,
        label: "代替死亡",
      },
    ],
    notes:
      "1) 三人存活且白天無處決 → 陣營獲勝 2) 夜裡將死時可能他人代死；可選紀錄",
  },
];

function deepMergeRule(base, patch) {
  const out = { ...base };
  Object.keys(patch).forEach((k) => {
    if (k === "sentence") {
      out.sentence = { ...(base.sentence || {}), ...patch.sentence };
    } else if (patch[k] === null) {
      delete out[k];
    } else {
      out[k] = patch[k];
    }
  });
  return out;
}

function applyCardSentence(rule, card) {
  const next = { ...rule, sentence: { ...(rule.sentence || {}) } };
  if (card.verb && card.verb !== "(無)" && card.verb !== "（無）") {
    // Prefer structural patch action if present later; here set from card
    if (!STRUCTURAL[card.id] || !STRUCTURAL[card.id].sentence) {
      next.sentence.action = card.verb.includes("／")
        ? card.verb.split("／")[0]
        : card.verb;
    }
  }
  if (
    card.template &&
    card.template !== "``" &&
    (!STRUCTURAL[card.id] || !STRUCTURAL[card.id].sentence)
  ) {
    next.sentence.template = card.template;
  }
  if (card.notes && !card.notes.startsWith("sheet:")) {
    if (!STRUCTURAL[card.id] || STRUCTURAL[card.id].notes == null) {
      next.notes = card.notes;
    }
  } else if (next.notes && String(next.notes).startsWith("sheet:")) {
    next.notes = card.notes && !card.notes.startsWith("sheet:")
      ? card.notes
      : "";
  }
  return next;
}

function main() {
  const allCards = new Map();
  DOCS.forEach((p) => {
    if (!fs.existsSync(p)) {
      console.warn("missing", p);
      return;
    }
    parseSkillCards(fs.readFileSync(p, "utf8")).forEach((c, id) => {
      allCards.set(id, c);
    });
  });

  const data = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const byId = new Map(
    data.rules.map((r, i) => [String(r.id).toLowerCase(), i]),
  );

  const updated = [];
  const added = [];

  // 1) Apply card sentence/notes for all known cards that have rules
  allCards.forEach((card, id) => {
    const idx = byId.get(id);
    if (idx == null) return;
    const before = JSON.stringify(data.rules[idx]);
    let rule = applyCardSentence(data.rules[idx], card);
    if (STRUCTURAL[id]) {
      rule = deepMergeRule(rule, STRUCTURAL[id]);
    }
    // Clear leftover sheet URLs when we have notes from cards/structural
    if (rule.notes && String(rule.notes).startsWith("sheet:")) {
      rule.notes = (STRUCTURAL[id] && STRUCTURAL[id].notes) || card.notes || "";
      if (String(rule.notes).startsWith("sheet:")) rule.notes = "";
    }
    data.rules[idx] = rule;
    if (JSON.stringify(rule) !== before) updated.push(id);
  });

  // 2) Structural-only for roles without cards parsed? already covered

  // 3) Add / merge new rules (incl. TB optional triggers)
  NEW_RULES.forEach((rule) => {
    const id = String(rule.id).toLowerCase();
    const clean = { ...rule };
    delete clean.sentenceFixed;
    if (byId.has(id)) {
      const idx = byId.get(id);
      data.rules[idx] = deepMergeRule(data.rules[idx], clean);
      updated.push(id);
      return;
    }
    data.rules.push(clean);
    byId.set(id, data.rules.length - 1);
    added.push(id);
  });

  data.generatedAt = new Date().toISOString();
  data.sourceNote =
    "Skill-card patches applied via scripts/apply-skill-cards-to-rules.js (docs/official-skill-cards-*.md)";
  fs.writeFileSync(RULES_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`cards parsed: ${allCards.size}`);
  console.log(`updated: ${[...new Set(updated)].sort().join(", ") || "(none)"}`);
  console.log(`added: ${[...new Set(added)].join(", ") || "(none)"}`);
  console.log(`total rules: ${data.rules.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { parseSkillCards, STRUCTURAL, NEW_RULES, main };
