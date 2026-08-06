/**
 * Apply TB official skill-card decisions into roleInteractionRules.json.
 * Source of truth: docs/official-skill-cards-tb.md (hand-edited).
 *
 * Usage: node scripts/apply-tb-skill-cards-to-rules.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RULES_PATH = path.join(ROOT, "src", "store", "roleInteractionRules.json");

const PATCHES = {
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
    notes:
      "主線：殺害目標。自殺轉生（爪牙成為小惡魔）另條／可選紀錄；可選 effect 關閉時無 └",
  },
  poisoner: {
    sentence: {
      action: "投毒",
      template: "{actor} → {action} → 選擇 {target} → {target} 中毒",
    },
  },
  monk: {
    sentence: {
      action: "保護",
      template: "{actor} → {action} → 選擇 {target}",
    },
  },
};

/** New TB trigger/optional rules not previously in the JSON. */
const NEW_RULES = [
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
    inputs: [{ key: "nominator", type: "player", label: "提名者" }],
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
      { key: "target", type: "player", label: "代替死亡玩家" },
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

function deepMergeRule(existing, patch) {
  const out = { ...existing };
  Object.keys(patch).forEach((key) => {
    if (key === "sentence" && existing.sentence && patch.sentence) {
      out.sentence = { ...existing.sentence, ...patch.sentence };
    } else {
      out[key] = patch[key];
    }
  });
  return out;
}

function main() {
  const data = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const byId = new Map();
  data.rules.forEach((r, i) => byId.set(String(r.id).toLowerCase(), i));

  const updated = [];
  Object.keys(PATCHES).forEach((id) => {
    const idx = byId.get(id);
    if (idx == null) {
      console.warn(`skip missing rule: ${id}`);
      return;
    }
    data.rules[idx] = deepMergeRule(data.rules[idx], PATCHES[id]);
    updated.push(id);
  });

  const added = [];
  NEW_RULES.forEach((rule) => {
    const id = String(rule.id).toLowerCase();
    if (byId.has(id)) {
      const idx = byId.get(id);
      data.rules[idx] = deepMergeRule(data.rules[idx], rule);
      updated.push(id);
      return;
    }
    data.rules.push(rule);
    byId.set(id, data.rules.length - 1);
    added.push(id);
  });

  data.generatedAt = new Date().toISOString();
  data.sourceNote =
    "TB skill-card patches applied via scripts/apply-tb-skill-cards-to-rules.js";

  fs.writeFileSync(RULES_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`updated: ${updated.join(", ")}`);
  console.log(`added: ${added.join(", ") || "(none)"}`);
  console.log(`total rules: ${data.rules.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { PATCHES, NEW_RULES, deepMergeRule, main };
