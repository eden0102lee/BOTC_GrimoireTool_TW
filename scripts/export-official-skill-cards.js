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

  // —— BMR ——
  chambermaid: {
    timing: ["everyNight"],
    impact: ["info"],
    target: "other",
    example:
      "小華【01.侍女】得知 小明【03.水手】 小美【04.賭徒】中有 [1] 位因自身能力醒來",
    verb: "得知",
    notes: "選兩名存活他玩家；回 0/1/2",
  },
  courtier: {
    timing: ["once", "everyNight"],
    impact: ["status"],
    target: "other",
    trigger: "每局一次選擇角色；其玩家醉酒三天三夜",
    example:
      "小華【01.侍臣】選擇 [小惡魔]\n└ 小明【03.小惡魔】醉酒 3",
    verb: "選擇",
    notes: "先選角色；在場才掛醉酒 3 並逐日遞減",
  },
  exorcist: {
    timing: ["fromNight2"],
    impact: ["info", "special"],
    target: "other",
    example:
      "小華【01.驅魔人】選擇 小明【03.小惡魔】\n└ 小明【03.小惡魔】已選擇\n└ 小明【03.小惡魔】得知驅魔人",
    verb: "選擇",
    notes: "不可與昨晚同目標；命中惡魔才勾選得知",
  },
  fool: {
    timing: ["once", "trigger"],
    impact: ["life", "special"],
    target: "self",
    trigger: "第一次「死亡」時不會死",
    example: "小華【01.弄臣】第一次死亡\n└ 倖免，小華【01.弄臣】失去能力",
    verb: "(無)",
    notes: "被動；通常掛「無能力」後不再觸發",
  },
  gambler: {
    timing: ["fromNight2"],
    impact: ["life", "info"],
    target: "both",
    example:
      "小華【01.賭徒】猜測 小明【03.水手】是 [刺客]\n└ 猜錯，小華【01.賭徒】死亡",
    verb: "猜測",
    notes: "猜對可關 effect／無 └；死亡的是賭徒本人",
  },
  gossip: {
    timing: ["fromNight2", "trigger"],
    impact: ["life"],
    target: "other",
    trigger: "白天公開聲明；當晚若正確則一名玩家死亡",
    example:
      "1.\n小華【01.造謠者】聲明 → 場上有三名外來者\n2.\n小華【01.造謠者】殺害 小明【03.水手】\n└ 小明【03.水手】死亡",
    verb: "聲明／殺害",
    notes: "聲明正確才夜殺；夜裡由說書人選死者",
  },
  grandmother: {
    timing: ["firstOnly", "trigger"],
    impact: ["info", "life", "special"],
    target: "other",
    trigger: "孫子被惡魔殺死 → 祖母死亡",
    example:
      "1.\n小華【01.祖母】得知 小明【03.水手】是 [水手]\n└ 小明【03.水手】孫子\n2.\n小明【03.水手】被惡魔殺害\n└ 小華【01.祖母】死亡",
    verb: "得知",
    notes: "首夜得知孫子；孫子被惡魔殺害時祖母連坐死亡",
  },
  innkeeper: {
    timing: ["fromNight2"],
    impact: ["special", "status"],
    target: "other",
    example:
      "小華【01.旅店老闆】保護 小明【03.水手】 小美【04.賭徒】\n└ 小明【03.水手】保護\n└ 小美【04.賭徒】保護\n└ 小美【04.賭徒】醉酒",
    verb: "保護",
    notes: "兩人皆保護；其中一人醉酒",
  },
  minstrel: {
    timing: ["trigger"],
    impact: ["status"],
    target: "both",
    trigger: "有爪牙被處決",
    example:
      "小明【03.刺客】被處決\n└ 小華【01.吟遊詩人】觸發：除了自己和旅行者以外全員醉酒至明天黃昏",
    verb: "(無)",
    notes: "白天觸發；標記「所有人醉酒」",
  },
  pacifist: {
    timing: ["trigger"],
    impact: ["life", "special"],
    target: "other",
    trigger: "善良玩家被處決時可能不死",
    example:
      "小明【03.水手】被處決\n└ 小華【01.和平主義者】：小明【03.水手】倖免",
    verb: "(無)",
    notes: "被動／說書人裁定；無夜動",
  },
  professor: {
    timing: ["once", "fromNight2"],
    impact: ["life"],
    target: "other",
    example:
      "小華【01.教授】復活 小明【03.水手】\n└ 小明【03.水手】復活",
    verb: "復活",
    notes: "目標須為死亡鎮民；非鎮民則無效",
  },
  sailor: {
    timing: ["everyNight"],
    impact: ["status", "special"],
    target: "both",
    example:
      "1.\n小華【01.水手】選擇 小明【03.賭徒】\n└ 小明【03.賭徒】醉酒\n2.\n小華【01.水手】選擇 小明【03.賭徒】\n└ 小華【01.水手】醉酒",
    verb: "選擇",
    notes: "你或目標之一醉酒；水手不會死（被動）",
  },
  tealady: {
    timing: ["trigger"],
    impact: ["special"],
    target: "other",
    trigger: "兩側存活鄰居皆善良 → 他們不會死",
    example:
      "小華【01.茶藝師】兩側存活鄰居皆善良\n└ 小明【03.水手】不會死亡\n└ 小美【04.賭徒】不會死亡",
    verb: "(無)",
    notes: "被動；標記「不會死」由說書人手動掛在鄰居",
  },
  goon: {
    timing: ["trigger"],
    impact: ["status", "alignment"],
    target: "both",
    trigger: "每晚首位以能力選中你的玩家醉酒，你轉為其陣營",
    example:
      "小華【01.莽夫】被 小明【03.普卡】選擇\n└ 小明【03.普卡】醉酒\n└ 小華【01.莽夫】轉變為[邪惡]",
    verb: "(無)",
    notes: "被動紀錄；醉酒的是選中莽夫的玩家；陣營轉變可選",
  },
  lunatic: {
    timing: ["setup", "everyNight"],
    impact: ["role", "status", "info", "special"],
    target: "both",
    trigger: "劇本含瘋子時才顯示設置字卡",
    example:
      "1.\n小華【01.方古】是[瘋子]\n2.\n小華【01.瘋子】選擇 小明【03.水手】\n└ 小明【03.水手】攻擊1\n└ 惡魔得知瘋子目標 小明【03.水手】",
    verb: "是／選擇",
    notes:
      "劇本含瘋子才顯示 setup。已指派或已有「是瘋子」標記→選惡魔角色＋掛「是瘋子」。瘋子假殺＋告知真惡魔；無真實死亡除非他因",
  },
  moonchild: {
    timing: ["trigger", "fromNight2"],
    impact: ["life"],
    target: "other",
    trigger: "得知自己死亡時公開選一名存活玩家；若善良則當晚死亡",
    example:
      "小華【01.月之子】死亡時選擇 小明【03.水手】\n└ 小明【03.水手】死亡",
    verb: "選擇",
    notes: "目標善良才死；邪惡可關 effect",
  },
  tinker: {
    timing: ["fromNight2", "trigger"],
    impact: ["life"],
    target: "self",
    trigger: "隨時可能死亡（說書人裁定）",
    example: "小華【01.修補匠】死亡",
    verb: "(無)",
    notes: "可無主動選擇；隨時可能死亡",
  },
  assassin: {
    timing: ["once", "fromNight2"],
    impact: ["life"],
    target: "other",
    example:
      "小華【01.刺客】刺殺 小明【03.水手】\n└ 小明【03.水手】死亡",
    verb: "刺殺",
    notes: "無視「不會死」；每局一次",
  },
  devilsadvocate: {
    timing: ["everyNight"],
    impact: ["special"],
    target: "other",
    example:
      "1.\n小華【01.魔鬼代言人】選擇 小明【03.水手】\n└ 小明【03.水手】處決保護\n2.\n小明【03.水手】被處決\n└ 小華【01.魔鬼代言人】：小明【03.水手】倖免",
    verb: "選擇",
    notes: "不可與昨晚同目標；例 2 為處決敘事（可選）",
  },
  godfather: {
    timing: ["setup", "firstOnly", "fromNight2"],
    impact: ["info", "life", "special"],
    target: "both",
    trigger: "當日有外來者死亡 → 當晚可殺一人",
    example:
      "1.\n小華【01.教父】設置 → 外來者 [+1]\n2.\n小華【01.教父】得知 → 外來者：[修補匠] [莽夫]\n3.\n小華【01.教父】殺害 小明【03.水手】",
    verb: "得知／殺害",
    notes: "首夜自動帶入在場外來者；殺人僅在外來者白日死後（optional 卡），僅記錄殺害動作",
  },
  mastermind: {
    timing: ["trigger"],
    impact: ["special"],
    target: "both",
    trigger: "惡魔被處決後遊戲多一日；再有人處決則其陣營敗",
    example:
      "1.\n惡魔被處決，觸發主謀能力：遊戲再進行一天\n2.\n小明【03.水手】被處決，因為主謀能力導致[善良]陣營落敗",
    verb: "(無)",
  },
  po: {
    timing: ["fromNight2"],
    impact: ["life"],
    target: "other",
    example:
      "1.\n小華【01.珀】殺害 小明【03.水手】\n└ 小明【03.水手】死亡\n2.\n小華【01.珀】沒有選擇任何玩家\n└ 小華【01.珀】攻擊x3\n3.\n小華【01.珀】殺害 小明【03.水手】 小美【04.賭徒】 小強【05.弄臣】\n└ 小明【03.水手】死亡\n└ 小美【04.賭徒】死亡\n└ 小強【05.弄臣】死亡",
    verb: "殺害",
    notes: "跳過後隔晚必須三殺；攻擊x3 掛在珀自身",
  },
  pukka: {
    timing: ["everyNight"],
    impact: ["status", "life"],
    target: "other",
    example:
      "小華【01.普卡】投毒 小明【03.水手】\n└ 小明【03.水手】中毒\n└ 小美【04.賭徒】死亡（先前中毒）",
    verb: "投毒",
    notes: "新選中毒；上夜中毒者今晚死亡（首夜通常無 prev）",
  },
  shabaloth: {
    timing: ["fromNight2"],
    impact: ["life"],
    target: "other",
    example:
      "小華【01.沙巴洛斯】殺害 小明【03.水手】 小美【04.賭徒】\n└ 小明【03.水手】死亡\n└ 小美【04.賭徒】死亡\n└ （可選）小強【05.弄臣】復活",
    verb: "殺害",
    notes: "殺兩人；可能反芻上夜選過且當前死亡者之一",
  },
  zombuul: {
    timing: ["fromNight2", "trigger"],
    impact: ["life", "special"],
    target: "both",
    trigger: "當日無人死亡才夜殺；第一次死亡不真正死（視為已死）",
    example:
      "1.\n小華【01.僵怖】殺害 小明【03.水手】\n└ 小明【03.水手】死亡\n2.\n小華【01.僵怖】第一次「死亡」→ 仍存活但視為已死",
    verb: "殺害",
    notes: "夜殺卡為 optional；「今天死亡」由說書人手動掛標記",
  },
  apprentice: {
    timing: ["firstOnly"],
    impact: ["role", "special"],
    target: "self",
    example:
      "小華【01.學徒】獲得 [水手] 能力\n└ 小華【01.水手】是學徒",
    verb: "獲得",
    notes: "善→鎮民能力／邪→爪牙能力；換代幣+標記",
  },
  bishop: {
    timing: ["trigger"],
    impact: ["special"],
    target: "both",
    trigger: "僅說書人可提名；每天至少提名一名不同陣營者",
    example: "(無)",
    verb: "(無)",
    notes: "旅行者被動；提名流程由說書人執行；通常 (無)",
  },
  judge: {
    timing: ["once", "trigger"],
    impact: ["special"],
    target: "both",
    trigger: "他玩家提名時，可強制處決成功或失敗（每局一次）",
    example:
      "小華【01.法官】裁定本次處決 [成功]",
    verb: "裁定",
  },
  matron: {
    timing: ["trigger"],
    impact: ["special"],
    target: "other",
    trigger: "白天可換至多三對座位；不可離座密談",
    example: "小華【01.女舍監】互換座位：小明↔小美、小強↔小芳",
    verb: "(無)",
  },
  voudon: {
    timing: ["trigger"],
    impact: ["special"],
    target: "both",
    trigger: "僅己與死者可投票；死者票無代幣／無門檻",
    example: "(無)",
    verb: "(無)",
    notes: "旅行者被動；影響投票規則",
  },

  // —— SNV ——
  artist: {
    timing: ["once", "trigger"],
    impact: ["info"],
    target: "self",
    trigger: "白天私下問是非題（每局一次）",
    example: "小華【01.藝術家】詢問說書人 → [是]",
    verb: "詢問",
  },
  clockmaker: {
    timing: ["firstOnly"],
    impact: ["info"],
    target: "self",
    example: "小華【01.鐘錶匠】得知 [2]",
    verb: "得知",
    notes: "惡魔到最近爪牙距離（鄰座=1）",
  },
  dreamer: {
    timing: ["everyNight"],
    impact: ["info"],
    target: "other",
    example:
      "小華【01.築夢師】得知 小明【03.藝術家】是 [藝術家] 或 [方古]",
    verb: "得知",
    notes: "一善一邪角色，其一正確",
  },
  flowergirl: {
    timing: ["fromNight2"],
    impact: ["info", "special"],
    target: "self",
    example: "小華【01.賣花女孩】得知惡魔 [有/沒有]投票",
    verb: "得知",
  },
  juggler: {
    timing: ["once", "firstDay", "fromNight2"],
    impact: ["info", "special"],
    target: "self",
    trigger: "首日公開猜至多五次；當晚得知猜對數",
    example:
      "1.\n小華【01.雜耍藝人】→ 首日公開猜測 → 小明是方古、小美是心上人…\n2.\n小華【01.雜耍藝人】得知猜對 [3]",
    verb: "猜測／得知",
  },
  mathematician: {
    timing: ["everyNight"],
    impact: ["info", "special"],
    target: "self",
    example: "小華【01.數學家】得知 [1]",
    verb: "得知",
    notes: "今日能力異常作用的玩家人數",
  },
  oracle: {
    timing: ["fromNight2"],
    impact: ["info"],
    target: "self",
    example: "小華【01.神諭者】得知 [2]",
    verb: "得知",
    notes: "死亡玩家中邪惡數量",
  },
  philosopher: {
    timing: ["once", "everyNight"],
    impact: ["role", "status", "special"],
    target: "both",
    example:
      "小華【01.哲學家】選擇 [數學家]\n└ 小華【01.哲學家】是哲學家（獲數學家能力）\n└ 小明【03.數學家】醉酒",
    verb: "選擇",
    notes: "選善良角色；在場則對方醉酒；掛「是哲學家」標記",
  },
  sage: {
    timing: ["trigger", "fromNight2"],
    impact: ["info"],
    target: "other",
    trigger: "被惡魔殺死時得知兩名玩家之一為惡魔",
    example:
      "小華【01.賢者】死亡後得知 小明【03.方古】 小美【04.藝術家】其中一位是惡魔",
    verb: "得知",
  },
  savant: {
    timing: ["trigger"],
    impact: ["info"],
    target: "self",
    trigger: "每個白天可問說書人兩條資訊（一真一假）",
    example:
      "小華【01.博學者】得知兩條資訊\n└[輸入][正確/錯誤]\n└[輸入][正確/錯誤]",
    verb: "得知",
    notes: "可選列入晝間能力",
  },
  seamstress: {
    timing: ["once", "everyNight"],
    impact: ["info"],
    target: "other",
    example:
      "小華【01.女裁縫】得知 小明【03.藝術家】 小美【04.方古】是否同陣營 → [否]",
    verb: "得知",
  },
  snakecharmer: {
    timing: ["everyNight"],
    impact: ["role", "alignment", "status"],
    target: "both",
    example:
      "小華【01.舞蛇人】選擇 小明【03.方古】\n└ 互換角色／陣營\n└ 小明【03.舞蛇人】中毒",
    verb: "選擇",
    notes: "僅命中惡魔時交換（說書人手動換代幣）；新舞蛇人中毒",
  },
  towncrier: {
    timing: ["fromNight2"],
    impact: ["info", "special"],
    target: "self",
    example: "小華【01.城鎮公告員】得知爪牙 [有/沒有]提名",
    verb: "得知",
  },
  barber: {
    timing: ["trigger", "fromNight2"],
    impact: ["role"],
    target: "other",
    trigger: "理髮師死亡之夜，惡魔可換兩名玩家角色",
    example:
      "1.\n小華【01.理髮師】死亡 → 今晚可剪頭髮\n2.\n惡魔交換 小明【03.藝術家】 ↔ 小美【04.數學家】角色",
    verb: "(無)",
    notes: "標記掛在理髮師；不可選其他惡魔；換角由說書人手動",
  },
  klutz: {
    timing: ["trigger"],
    impact: ["special"],
    target: "other",
    trigger: "得知死亡時公開選一名存活者；若邪惡則己方陣營敗",
    example:
      "小華【01.呆瓜】死亡時選擇 小明【03.方古】\n└ [善良]陣營落敗",
    verb: "選擇",
  },
  mutant: {
    timing: ["trigger"],
    impact: ["special"],
    target: "self",
    trigger: "若執著讓人相信自己是外來者，可能被處決",
    example: "(無)",
    verb: "(無)",
    notes: "被動／說書人裁定",
  },
  sweetheart: {
    timing: ["trigger", "fromNight2"],
    impact: ["status"],
    target: "other",
    trigger: "心上人死亡時一名玩家開始醉酒",
    example:
      "小華【01.心上人】死亡\n└ 小明【03.藝術家】醉酒",
    verb: "(無)",
  },
  cerenovus: {
    timing: ["everyNight"],
    impact: ["status"],
    target: "other",
    example:
      "小華【01.洗腦師】洗腦 小明【03.藝術家】為[鐘錶匠]瘋狂\n└ 小明【03.藝術家】瘋狂",
    verb: "洗腦",
    notes: "說書人裁定；例 2（不夠瘋狂遭處決）為可選敘事",
  },
  eviltwin: {
    timing: ["firstOnly", "trigger"],
    impact: ["info", "special"],
    target: "other",
    trigger: "善側雙胞胎被處決→邪勝；雙方皆活時善不能勝",
    example:
      "1.\n小華【01.鏡像雙子】與 小明【03.藝術家】互認\n└ 雙方掛雙胞胎\n2.\n鏡像雙子雙方皆存活，善良陣營無法獲勝\n3.\n善良雙子死於處決，邪惡陣營獲勝",
    verb: "(無)",
  },
  pithag: {
    timing: ["fromNight2"],
    impact: ["role", "life"],
    target: "other",
    example:
      "1.\n小華【01.麻臉巫婆】選擇 小明【03.藝術家】變成 [男爵]\n└ 小明【03.藝術家】變成 小明【03.男爵]\n2.\n小華【01.麻臉巫婆】創造了一個惡魔\n└ 說書人選擇 小美【02.方古】死亡",
    verb: "選擇",
    notes: "角色在場則關 setRole；變出新惡魔時當晚死亡由說書人決定",
  },
  witch: {
    timing: ["everyNight"],
    impact: ["special", "life"],
    target: "other",
    example:
      "1.\n小華【01.女巫】詛咒 小明【03.藝術家】\n└ 小明【03.藝術家】詛咒\n2.\n小明【03.藝術家】被咒殺死亡",
    verb: "詛咒",
    notes: "僅三人存活時失去能力；夜動掛詛咒，提名時用咒殺卡",
  },
  fanggu: {
    timing: ["setup", "fromNight2", "once"],
    impact: ["life", "role", "alignment"],
    target: "both",
    trigger: "殺到外來者時可改為己死、對方變邪惡方古（每局一次）",
    example:
      "1.\n本局外來者 +1\n2.\n小華【01.方古】殺害 小明【03.藝術家】\n└ 小明【03.藝術家】死亡\n3.\n小華【01.方古】殺害 小美【04.呆瓜】（外來者）→ 轉化\n└ 小華【01.方古】死亡\n└ 小美【04.方古】成為邪惡方古",
    verb: "殺害／轉化",
  },
  nodashii: {
    timing: ["setup", "fromNight2"],
    impact: ["life", "status"],
    target: "both",
    example:
      "1.\n小華【01.諾-達鯴】設置 → 小美【04.鐘錶匠】 小強【05.數學家】中毒\n2.\n小華【01.諾-達鯴】殺害 小明【03.藝術家】\n└ 小明【03.藝術家】死亡",
    verb: "殺害",
    notes:
      "setup 時對兩側最近鎮民掛中毒（座位／角色變動時需更新）；夜殺為 fromNight2",
  },
  vigormortis: {
    timing: ["setup", "fromNight2"],
    impact: ["life", "status", "special"],
    target: "both",
    example:
      "1.\n本局外來者 -1\n2.\n小華【01.亡骨魔】殺害 小明【03.洗腦師】\n└ 小明【03.洗腦師】死亡\n└ 小明【03.洗腦師】具有能力\n└ 小美【04.藝術家】中毒",
    verb: "殺害",
    notes: "殺爪牙才開「具有能力」與鄰近中毒；開局 −1 外來者",
  },
  vortox: {
    timing: ["fromNight2", "trigger"],
    impact: ["life", "info", "special"],
    target: "both",
    trigger: "白天無處決 → 邪惡獲勝；鎮民資訊必錯",
    example:
      "1.\n小華【01.渦流】殺害 小明【03.藝術家】\n└ 小明【03.藝術家】死亡\n2.\n白天無處決 → [邪惡]陣營獲勝",
    verb: "殺害",
    notes: "觸發卡紀錄白天無處決時邪惡獲勝；鎮民資訊必錯",
  },
  barista: {
    timing: ["everyNight"],
    impact: ["special", "info"],
    target: "other",
    example:
      "1.\n小華【01.咖啡師】選擇 小明【03.藝術家】 → [解除醉酒中毒]\n└ 小明【03.藝術家】清醒&健康\n2.\n小華【01.咖啡師】選擇 小美【04.數學家】 → [能力發動兩次]\n└ 小美【04.數學家】能力x2",
    verb: "選擇",
    notes: "說書人二選一；該玩家會得知是哪個效果",
  },
  bonecollector: {
    timing: ["once", "fromNight2"],
    impact: ["special"],
    target: "other",
    example:
      "小華【01.集骨者】選擇 小明【03.藝術家】（死亡）\n└ 小明【03.藝術家】具有能力",
    verb: "選擇",
    notes: "至明昏恢復能力；每局一次",
  },
  butcher: {
    timing: ["trigger"],
    impact: ["special"],
    target: "other",
    trigger: "白天首次處決後可再提名一人",
    example: "小華【01.屠夫】追加提名 小明【03.藝術家】",
    verb: "追加提名",
  },
  deviant: {
    timing: ["trigger"],
    impact: ["special"],
    target: "self",
    trigger: "今天夠有趣則不會被放逐",
    example: "(無)",
    verb: "(無)",
    notes: "旅行者被動；說書人裁定",
  },
  harlot: {
    timing: ["fromNight2"],
    impact: ["info", "life"],
    target: "both",
    example:
      "小華【01.流鶯】選擇 小明【03.藝術家】（同意/不同意）\n└ 小華【01.流鶯】得知 [藝術家]\n└ （可選）雙方死亡",
    verb: "選擇",
    notes: "不同意則無└；說書人可開雙殺 effect",
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

1. 改完 \`docs/official-skill-cards-<edition>.md\` 後整檔覆蓋（規則欄位與例句皆在此檔）。
2. 執行 \`npm run apply:skill-cards\` 寫入 \`roleInteractionRules.json\`（戰報互動）。
3. 重新匯出（可選）：\`npm run export:skill-cards -- all\`（會依 JSON+OVERRIDES 覆寫 md，手改例句請先備份）。

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
  const notes = ov
    ? ov.notes || ""
    : (rule && rule.notes) || "";
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
