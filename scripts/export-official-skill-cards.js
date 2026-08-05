/**
 * Generate official skill info cards for ST to edit.
 * Taxonomy: timing + impact + example sentences.
 *
 * Usage: node scripts/export-official-skill-cards.js [tb|bmr|snv|all]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ROLES_PATH = path.join(ROOT, "src/roles.json");
const RULES_PATH = path.join(ROOT, "src/store/roleInteractionRules.json");
const OUT_DIR = path.join(ROOT, "docs");

const EDITION = (process.argv[2] || "tb").toLowerCase();
const EDITIONS = EDITION === "all" ? ["tb", "bmr", "snv"] : [EDITION];

/** Manual overrides: timing, impact, trigger, example, notes (ST-facing). */
const OVERRIDES = {
  chef: {
    timing: ["firstOnly"],
    impact: ["info"],
    target: "self",
    example: "小華【01.廚師】得知 [2]",
    notes: "僅首夜資訊",
  },
  empath: {
    timing: ["everyNight"],
    impact: ["info"],
    target: "self",
    example: "小華【01.共情者】得知 [2]",
  },
  poisoner: {
    timing: ["everyNight"],
    impact: ["status"],
    target: "other",
    example:
      "小華【01.投毒者】投毒 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】中毒",
    verb: "投毒",
  },
  imp: {
    timing: ["fromNight2"],
    impact: ["life", "role"],
    target: "both",
    trigger: "每晚選擇；若自殺則爪牙變小惡魔（另記）",
    example:
      "1.\n小華【01.小惡魔】殺害 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】死亡\n2.\n小華【01.小惡魔】選擇自己\n└ 小華【01.小惡魔】死亡\n└ 小美【03.投毒者】成為 [小惡魔]",
    verb: "殺害",
    notes: "可選 effect 關閉時無 └；自殺轉生另條；生成可選字卡",
  },
  monk: {
    timing: ["fromNight2"],
    impact: ["special"],
    target: "other",
    example:
      "小華【01.僧侶】保護 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】保護",
    verb: "保護",
  },
  ravenkeeper: {
    timing: ["trigger"],
    impact: ["info"],
    target: "other",
    trigger: "該角色今晚死亡",
    example: "小華【01.守鴉人】死亡後得知 小明【03.洗衣婦】",
  },
  undertaker: {
    timing: ["fromNight2"],
    impact: ["info"],
    target: "self",
    trigger: "當天有人死於處決時才有資訊",
    example: "小華【01.送葬者】得知 今日處決 [洗衣婦]",
    notes: "勿 └ 自身處決；無處決可寫 (無) 或不記",
  },
  fortuneteller: {
    timing: ["everyNight", "setup"],
    impact: ["info", "special"],
    target: "other",
    trigger: "開局選定一名善良玩家「視為惡魔」（整局）",
    example:
      "1.\n小華【01.占卜師】始終將 小明【03.洗衣婦】視為惡魔\n2.\n小華【01.占卜師】查驗 小明【03.洗衣婦】 小美【04.僧侶】得知 [是]",
    notes: "res 用 是/否；「視為惡魔」標記僅開局一次",
  },
  washerwoman: {
    timing: ["firstOnly"],
    impact: ["info", "special"],
    target: "other",
    example:
      "小華【01.洗衣婦】得知 小明【03.圖書管理員】 小美【04.男爵】其中一位是 [圖書管理員]\n└ 小明【03.圖書管理員】鎮民\n└ 小美【04.男爵】非鎮民",
  },
  investigator: {
    timing: ["firstOnly"],
    impact: ["info", "special"],
    target: "other",
    example:
      "小華【01.調查員】得知 小明【03.男爵】 小美【04.僧侶】其中一位是 [男爵]\n└ 小明【03.男爵】爪牙\n└ 小美【04.僧侶】非爪牙",
  },
  librarian: {
    timing: ["firstOnly"],
    impact: ["info", "special"],
    target: "other",
    example:
      "小華【01.圖書管理員】得知 小明【03.洗衣婦】 小美【04.僧侶】其中一位是 [酒鬼]\n└ 小明【03.洗衣婦】外來者\n└ 小美【04.僧侶】非外來者",
  },
  spy: {
    timing: ["everyNight"],
    impact: ["info"],
    target: "self",
    example: "小華【01.間諜】查看魔典",
    verb: "查看魔典",
    notes: "勿預設 └ 醉酒/中毒",
  },
  scarletwoman: {
    timing: ["trigger"],
    impact: ["role", "alignment"],
    target: "self",
    trigger: "≥5 名玩家存活（不含旅行者）時惡魔死亡",
    example: "小華【01.紅唇女郎】成為[小惡魔]",
    verb: "成為",
    notes: "非夜「選擇」；觸發時記錄",
  },
  drunk: {
    timing: ["setup"],
    impact: ["role", "status"],
    target: "other",
    trigger: "劇本含酒鬼時才顯示設置字卡",
    example: "小華【01.獵手】是[酒鬼]",
    verb: "是",
    notes:
      "設置 A：已指派酒鬼→選鎮民角色，玩家角色改為該角色＋掛「是酒鬼」；設置 B：未指派且無標記→選善良玩家僅掛「是酒鬼」。主句無 └",
  },
  marionette: {
    timing: ["setup"],
    impact: ["role", "status"],
    target: "other",
    trigger: "劇本含提線木偶時才顯示設置字卡",
    example: "小華【01.獵手】是[提線木偶]",
    verb: "是",
    notes:
      "設置 A：已指派提線木偶→選善良角色，玩家角色改為該角色＋掛「是提線木偶」；設置 B：未指派且無標記→選善良玩家僅掛「是提線木偶」。主句無 └",
  },
  slayer: {
    timing: ["once", "trigger"],
    impact: ["life"],
    target: "other",
    trigger: "白天公開使用，每局一次；目標為惡魔則死亡",
    example:
      "小華【01.獵手】獵殺 小美【02.小惡魔】\n└ 小美【02.小惡魔】死亡",
    verb: "獵殺",
    notes: "可選 effect 關閉時無 └；需晝間規則",
  },
  recluse: {
    timing: ["trigger"],
    impact: ["info"],
    target: "self",
    trigger: "被動：可能被當作邪惡／爪牙／惡魔",
    example: "(無)",
    verb: "(無)",
    notes: "被動，通常不寫戰報",
  },
  baron: {
    timing: ["setup"],
    impact: ["special"],
    target: "self",
    example: "本局外來者人數為 n +2",
    verb: "(無)",
    notes: "開局紀錄即可；僅影響開局外來者數量",
  },
  beggar: {
    timing: ["trigger"],
    impact: ["info", "special"],
    target: "both",
    trigger: "收到死亡玩家投票標記時得知其陣營",
    example: "(無)",
    verb: "(無)",
  },
  gunslinger: {
    timing: ["trigger", "once"],
    impact: ["life"],
    target: "other",
    trigger: "每個白天首次投票統計後可選一名剛投票者死亡",
    example:
      "小華【01.槍手】槍殺 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】死亡",
    verb: "槍殺",
    notes: "白天；once 指每次投票段一次",
  },
  bureaucrat: {
    timing: ["everyNight"],
    impact: ["special"],
    target: "other",
    example:
      "小華【01.官員】選擇 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】票數x3",
  },
  butler: {
    timing: ["everyNight"],
    impact: ["special"],
    target: "other",
    example:
      "小華【01.管家】選擇 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】主人",
  },
  thief: {
    timing: ["everyNight"],
    impact: ["special"],
    target: "other",
    example:
      "小華【01.竊賊】選擇 小明【03.洗衣婦】\n└ 小明【03.洗衣婦】負數票",
  },
  soldier: {
    timing: ["trigger"],
    impact: ["special"],
    target: "self",
    trigger: "被惡魔負面能力選中時無效（被動）",
    example: "惡魔選擇了小明【01.士兵】\n└ 無效",
    verb: "(無)",
    notes: "惡魔能力落在士兵上時記錄",
  },
  saint: {
    timing: ["trigger"],
    impact: ["special"],
    target: "self",
    trigger: "死於處決 → 所屬陣營落敗",
    example: "小華【01.聖徒】死於處決，[善良]陣營落敗",
    verb: "(無)",
  },
  scapegoat: {
    timing: ["trigger"],
    impact: ["life"],
    target: "self",
    trigger: "同陣營玩家被處決時可能代替被處決",
    example: "(無)",
    verb: "(無)",
  },
  virgin: {
    timing: ["once", "trigger"],
    impact: ["life"],
    target: "other",
    trigger: "首次被提名且提名者為鎮民 → 提名者立刻處決",
    example:
      "小明【03.僧侶】提名 小華【01.貞潔者】\n└ 小明【03.僧侶】被處決死亡",
    verb: "(無)",
    notes: "晝間觸發；可併入提名／處決戰報",
  },
  mayor: {
    timing: ["trigger"],
    impact: ["life", "special"],
    target: "both",
    trigger: "三人存活且白天無處決，你的陣營獲勝；夜裡將死時可能他人代死",
    example:
      "1.\n三人存活且白天無處決，小明【03.鎮長】帶領[善良]陣營獲勝\n\n2.\n小明【03.鎮長】即將死亡\n└ 小華【01.僧侶】代替死亡",
    verb: "(無)",
    notes: "生成可選字卡",
  },
};

function inferTiming(role) {
  const t = [];
  if (role.setup) t.push("setup");
  const fn = role.firstNight || 0;
  const on = role.otherNight || 0;
  if (fn > 0 && on > 0) t.push("everyNight");
  else if (fn > 0 && on === 0) t.push("firstOnly");
  else if (fn === 0 && on > 0) t.push("fromNight2");
  return t;
}

function inferImpact(rule) {
  if (!rule) return [];
  const set = new Set();
  const effects = rule.effects || [];
  const action = (rule.sentence && rule.sentence.action) || "";
  if (effects.some((e) => e.type === "setDead" || e.type === "setRevive")) {
    set.add("life");
  }
  if (
    effects.some((e) =>
      ["中毒", "醉酒", "瘋狂"].includes(e.reminderName),
    )
  ) {
    set.add("status");
  }
  if (
    effects.some(
      (e) =>
        e.type === "addReminder" &&
        !["中毒", "醉酒", "瘋狂", "死亡"].includes(e.reminderName),
    )
  ) {
    set.add("special");
  }
  if (
    action === "得知" ||
    action === "查看魔典" ||
    (rule.inputs || []).some((i) => i.type === "number" || i.key === "res")
  ) {
    set.add("info");
  }
  return [...set];
}

function formatInputs(rule) {
  if (!rule || !rule.inputs || !rule.inputs.length) return "(無)";
  return rule.inputs
    .map((i) => `${i.type}:${i.key}${i.label ? `(${i.label})` : ""}`)
    .join(", ");
}

function formatEffects(rule) {
  if (!rule || !rule.effects || !rule.effects.length) return "(無)";
  return rule.effects
    .map((e) => e.label || `${e.type}${e.reminderName ? `:${e.reminderName}` : ""}`)
    .join("、");
}

function header() {
  return `# 官方角色技能資訊卡

> 自動產生：\`node scripts/export-official-skill-cards.js <edition>\`  
> 更新：${new Date().toISOString().slice(0, 10)}  
> **請直接改各角色欄位後整檔覆蓋**；留空表示不確定。

## 審核後套用

1. 改完 \`docs/official-skill-cards-<edition>.md\` 後整檔覆蓋。
2. TB 版執行 \`node scripts/apply-tb-skill-cards-to-rules.js\` 寫入 \`roleInteractionRules.json\`。
3. 例句可改 \`docs/official-sentence-edit-tb.md\`（或審核版 \`official-sentence-review-*.md\`）。
4. 重新匯出：\`npm run export:skill-cards -- all\`、\`npm run export:sentence-examples -- all\`。

## 代碼說明

### 時機（可多個，逗號分隔）

| 代碼 | 含義 |
| --- | --- |
| \`setup\` | 設置階段影響設置 |
| \`once\` | 一次性（整局或該情境一次） |
| \`firstOnly\` | 僅首夜 |
| \`everyNight\` | 每個夜晚（含首夜） |
| \`fromNight2\` | 次夜開始每個夜晚（夜晚*） |
| \`trigger\` | 條件滿足觸發（請填「觸發」欄） |

### 影響（可多個）

| 代碼 | 含義 |
| --- | --- |
| \`life\` | 生死（死亡／復活） |
| \`role\` | 角色變化 |
| \`alignment\` | 陣營變化 |
| \`status\` | 狀態（醉酒／中毒／瘋狂） |
| \`info\` | 獲得／告知資訊 |
| \`special\` | 特殊狀態（保護／票數／主人…） |

### 對象

\`self\` / \`other\` / \`both\`

### 例句

- 短動詞（預設「選擇」）+ 對象  
- 結果另起一行 \`└ …\`  
- 無戰報寫 \`(無)\`

---
`;
}

function cardBlock(role, rule, ov) {
  const timing =
    (ov && ov.timing) || inferTiming(role);
  const impact =
    (ov && ov.impact) || inferImpact(rule);
  const target = (ov && ov.target) || "";
  const trigger = (ov && ov.trigger) || "";
  const verb =
    (ov && ov.verb) ||
    (rule && rule.sentence && rule.sentence.action) ||
    "選擇";
  const example =
    (ov && ov.example) ||
    (rule ? `（請依規則補例句；action=${verb}）` : "(無)");
  const notes = (ov && ov.notes) || (rule && rule.notes) || "";
  const ability = (role.ability || "").replace(/\n/g, " ");
  const activation = (rule && rule.activation) || "";
  const enabled =
    rule && rule.enabled === false ? "否" : rule ? "是" : "(無規則)";

  let md = `### ${role.id} | ${role.name || role.id}\n\n`;
  md += `- team: \`${role.team || ""}\`\n`;
  md += `- 能力: ${ability}\n`;
  md += `- 規則: enabled=${enabled}${activation ? `, activation=${activation}` : ""}\n`;
  md += `- 時機: ${timing.join(", ") || "(請填)"}\n`;
  md += `- 影響: ${impact.join(", ") || "(請填)"}\n`;
  md += `- 對象: ${target || "(請填)"}\n`;
  md += `- 觸發: ${trigger || "(無)"}\n`;
  md += `- 動詞: ${verb}\n`;
  md += `- 輸入: ${formatInputs(rule)}\n`;
  md += `- effects: ${formatEffects(rule)}\n`;
  md += `- template: \`${(rule && rule.sentence && rule.sentence.template) || ""}\`\n`;
  md += `- 例句:\n\n\`\`\`\n${example}\n\`\`\`\n`;
  md += `- 備註: ${notes || ""}\n\n`;
  return md;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const roles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
  const rulesDoc = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const ruleMap = new Map(
    (rulesDoc.rules || []).map((r) => [r.id.toLowerCase(), r]),
  );

  EDITIONS.forEach((ed) => {
    const list = roles
      .filter((r) => r.edition === ed)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "zh"));

    let md = header().replace(
      "# 官方角色技能資訊卡",
      `# 官方角色技能資訊卡（${ed.toUpperCase()}）`,
    );
    md += `共 **${list.length}** 名角色。\n\n`;

    list.forEach((role) => {
      const rule = ruleMap.get(role.id.toLowerCase());
      const ov = OVERRIDES[role.id.toLowerCase()];
      md += cardBlock(role, rule, ov);
    });

    const outPath = path.join(OUT_DIR, `official-skill-cards-${ed}.md`);
    fs.writeFileSync(outPath, md, "utf8");
    console.log(`Wrote ${outPath} (${list.length} roles)`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { OVERRIDES };
