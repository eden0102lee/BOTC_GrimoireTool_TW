/**
 * SNV (夢殞春宵) full role-document overrides for battle-log cards.
 * Source of truth: docs/official-skill-cards-snv.md examples.
 * Consumed by scripts/apply-skill-cards-to-rules.js
 */
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

/** Full rule docs keyed by role id — replaces cards[] (and enabled/name) on apply. */
const SNV_ROLE_DOCS = {
  savant: {
    id: "savant",
    name: "博學者",
    enabled: true,
    cards: [
      {
        key: "every-day",
        label: "everyDay",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: [], days: ["first", "other"] },
        inputs: [
          { key: "note", type: "text", label: "兩條資訊（一真一假）" },
        ],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → 兩條資訊",
        },
        effects: [],
        notes: "白天私下；可選結構化戰報（筆記兩條資訊）",
      },
    ],
  },
  klutz: {
    id: "klutz",
    name: "呆瓜",
    enabled: true,
    cards: [
      {
        key: "death",
        label: "death",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
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
        notes: "若目標邪惡則己方陣營敗；可選紀錄；align 對應 └ 落敗陣營",
      },
    ],
  },
  artist: {
    id: "artist",
    name: "藝術家",
    enabled: true,
    cards: [
      {
        key: "every-day",
        label: "everyDay",
        enabled: true,
        activation: null,
        once: true,
        when: { nights: [], days: ["first", "other"] },
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
        notes: "白天私下；每局一次",
      },
    ],
  },
  butcher: {
    id: "butcher",
    name: "屠夫",
    enabled: true,
    cards: [
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "被追加提名的玩家" },
        ],
        sentence: {
          action: "追加提名",
          template: "{actor} → {action} → {target}",
        },
        effects: [],
        notes: "白天觸發；首次處決後可再提名",
      },
    ],
  },
  barista: {
    id: "barista",
    name: "咖啡師",
    enabled: false,
    cards: [],
  },
  towncrier: {
    id: "towncrier",
    name: "城鎮公告員",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          {
            key: "res",
            type: "select",
            label: "結果",
            options: ["有", "沒有"],
          },
        ],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {res}",
        },
        effects: [
          rem("towncrier", "爪牙提名", "actor", {
            label: "自身 爪牙提名",
            defaultOn: false,
          }),
          rem("towncrier", "爪牙未提名", "actor", {
            label: "自身 爪牙未提名",
            defaultOn: false,
          }),
        ],
        notes: "得知爪牙今日是否提名；結果內嵌主句",
      },
    ],
  },
  flowergirl: {
    id: "flowergirl",
    name: "賣花女孩",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          {
            key: "res",
            type: "select",
            label: "結果",
            options: ["有", "沒有"],
          },
        ],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {res}",
        },
        effects: [
          rem("flowergirl", "惡魔投票", "actor", {
            label: "自身 惡魔投票",
            defaultOn: false,
          }),
          rem("flowergirl", "惡魔未投票", "actor", {
            label: "自身 惡魔未投票",
            defaultOn: false,
          }),
        ],
        notes: "得知惡魔今日是否投票；結果內嵌主句",
      },
    ],
  },
  mathematician: {
    id: "mathematician",
    name: "數學家",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first", "other"], days: [] },
        inputs: [{ key: "num", type: "number", label: "得知數字" }],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {num}",
        },
        effects: [
          rem("mathematician", "異常", "actor", {
            label: "自身 異常",
            defaultOn: false,
          }),
        ],
        notes: "今日能力異常作用的玩家人數；結果內嵌主句",
      },
    ],
  },
  fanggu: {
    id: "fanggu",
    name: "方古",
    enabled: true,
    cards: [
      {
        key: "setup",
        label: "setup",
        enabled: true,
        activation: "setup",
        once: true,
        when: { nights: [], days: [] },
        inputs: [],
        sentence: {
          action: "設置",
          template: "本局外來者 +1",
        },
        effects: [],
        notes: "開局：+1 外來者",
      },
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
        ],
        sentence: {
          action: "殺害",
          template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
        },
        effects: [
          ...kill("fanggu", "target", { defaultOn: true }),
          rem("fanggu", "第一位外來者", "target", {
            label: "目標對象 第一位外來者",
            defaultOn: false,
          }),
          ...kill("fanggu", "actor", {
            id: "killSelf",
            defaultOn: false,
            label: "自身死亡（外來者轉化）",
          }),
          {
            id: "becomeFanggu",
            type: "setRole",
            targetFrom: "target",
            roleId: "fanggu",
            optional: true,
            defaultOn: false,
            label: "目標成為邪惡方古",
          },
        ],
        notes: "殺外來者可轉化（每局一次）；開局 +1 外來者",
      },
    ],
  },
  eviltwin: {
    id: "eviltwin",
    name: "鏡像雙子",
    enabled: true,
    cards: [
      {
        key: "first-night",
        label: "firstNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first"], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "鏡像雙子" },
          { key: "p2", type: "player", label: "對立雙子" },
        ],
        sentence: {
          action: "互認",
          template: "{p1} 與 {p2} 互認",
        },
        effects: [
          rem("eviltwin", "雙胞胎", "p1", {
            label: "鏡像雙子 雙胞胎",
            defaultOn: false,
          }),
          rem("eviltwin", "雙胞胎", "p2", {
            label: "對立雙子 雙胞胎",
            defaultOn: false,
          }),
        ],
        notes: "首夜互認；非 setup 改人數",
      },
      {
        key: "trigger-good-cannot-win",
        label: "triggerGoodCannotWin",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [],
        sentence: {
          action: "",
          template: "鏡像雙子存活，善良陣營無法獲勝",
        },
        effects: [],
        notes: "雙方皆活時善不能勝",
      },
      {
        key: "trigger-evil-wins",
        label: "triggerEvilWins",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [],
        sentence: {
          action: "",
          template: "善良雙子死於處決，邪惡陣營獲勝",
        },
        effects: [],
        notes: "善側雙子處決→邪勝",
      },
    ],
  },
  barber: {
    id: "barber",
    name: "理髮師",
    enabled: true,
    cards: [
      {
        key: "death",
        label: "death",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "玩家 1" },
          { key: "p2", type: "player", label: "玩家 2" },
        ],
        sentence: {
          action: "",
          template: "{actor}死亡 → 惡魔選擇 {p1} ↔ {p2} 交換角色",
        },
        effects: [
          rem("barber", "今晚剪頭髮", "p1", {
            label: "玩家 1 今晚剪頭髮",
            defaultOn: false,
          }),
        ],
        notes: "標記「今晚剪頭髮」可選；不可選其他惡魔",
      },
    ],
  },
  harlot: {
    id: "harlot",
    name: "流鶯",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
          {
            key: "consent",
            type: "select",
            label: "同意/不同意",
            options: ["同意", "不同意"],
          },
          {
            key: "roleLearned",
            type: "text",
            label: "得知角色（可空）",
          },
        ],
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
        notes: "不同意則無└；得知角色為資訊└；死亡為可選殉情，勿寫死進 template",
      },
    ],
  },
  pithag: {
    id: "pithag",
    name: "麻臉巫婆",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "p1", type: "alivePlayer", label: "目標玩家" },
          { key: "r1", type: "role", label: "對應角色" },
        ],
        sentence: {
          action: "選擇",
          template: "{actor} → {action} → {p1} → {r1}",
        },
        effects: [
          {
            id: "setRole",
            type: "setRole",
            targetFrom: "p1",
            roleFrom: "r1",
            optional: true,
            defaultOn: true,
            label: "目標變成該角色（角色不在場時）",
          },
        ],
        notes: "角色不在場時目標變成該角色",
      },
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "說書人選死者" },
        ],
        sentence: {
          action: "創造惡魔",
          template: "{actor}創造了一個惡魔 → {target} 死亡",
        },
        effects: [...kill("pithag", "target", { defaultOn: true })],
        notes: "若變出新惡魔，當晚惡魔擊殺由說書人決定",
      },
    ],
  },
  witch: {
    id: "witch",
    name: "女巫",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
        ],
        sentence: {
          action: "詛咒",
          template: "{actor} → {action} → 選擇 {target}",
        },
        effects: [
          rem("witch", "詛咒", "target", { label: "目標對象 詛咒" }),
        ],
        notes: "僅三人存活時失去能力；夜動只掛詛咒",
      },
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "被咒殺玩家" },
        ],
        sentence: {
          action: "",
          template: "{target}被咒殺死亡",
        },
        effects: [...kill("witch", "target", { defaultOn: true })],
        notes: "隔日被詛咒者發起提名 → 死亡",
      },
    ],
  },
  nodashii: {
    id: "nodashii",
    name: "諾-達鯴",
    enabled: true,
    cards: [
      {
        key: "setup",
        label: "setup",
        enabled: true,
        activation: "setup",
        once: true,
        when: { nights: [], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "鄰近鎮民 1" },
          { key: "p2", type: "player", label: "鄰近鎮民 2" },
        ],
        sentence: {
          action: "設置",
          template: "諾-達鯴導致 {p1}{p2} 中毒",
        },
        effects: [
          rem("nodashii", "中毒", "p1", { label: "鄰近鎮民1 中毒" }),
          rem("nodashii", "中毒", "p2", { label: "鄰近鎮民2 中毒" }),
        ],
        notes: "開局：兩側最近鎮民中毒（座位／角色變動時需更新）",
      },
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
        ],
        sentence: {
          action: "殺害",
          template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
        },
        effects: [...kill("nodashii", "target", { defaultOn: true })],
        notes: "夜殺 fromNight2",
      },
    ],
  },
  vigormortis: {
    id: "vigormortis",
    name: "亡骨魔",
    enabled: true,
    cards: [
      {
        key: "setup",
        label: "setup",
        enabled: true,
        activation: "setup",
        once: true,
        when: { nights: [], days: [] },
        inputs: [],
        sentence: {
          action: "設置",
          template: "本局外來者 -1",
        },
        effects: [],
        notes: "開局：−1 外來者",
      },
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
          {
            key: "p1",
            type: "player",
            label: "鄰近中毒鎮民（可空）",
          },
        ],
        sentence: {
          action: "殺害",
          template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
        },
        effects: [
          ...kill("vigormortis", "target", { defaultOn: true }),
          rem("vigormortis", "具有能力", "target", {
            label: "目標對象 具有能力",
            defaultOn: false,
          }),
          rem("vigormortis", "中毒", "p1", {
            label: "鄰近鎮民 中毒",
            defaultOn: false,
          }),
        ],
        notes: "殺爪牙→保留能力＋鄰近一鎮民中毒；開局 −1 外來者",
      },
    ],
  },
  vortox: {
    id: "vortox",
    name: "渦流",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
        ],
        sentence: {
          action: "殺害",
          template: "{actor} → {action} → 選擇 {target} → {target} 死亡",
        },
        effects: [...kill("vortox", "target", { defaultOn: true })],
        notes: "鎮民資訊必錯",
      },
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [],
        sentence: {
          action: "",
          template: "白天無處決 → [邪惡]陣營獲勝",
        },
        effects: [],
        notes: "白天無處決 → 邪惡獲勝",
      },
    ],
  },
  snakecharmer: {
    id: "snakecharmer",
    name: "舞蛇人",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "target", type: "alivePlayer", label: "目標對象" },
        ],
        sentence: {
          action: "選擇",
          template: "{actor} → {action} → 選擇 {target}",
        },
        effects: [
          rem("snakecharmer", "中毒", "target", {
            label: "目標對象 中毒（新舞蛇人；命中惡魔時開）",
            defaultOn: false,
          }),
        ],
        notes:
          "僅命中惡魔時交換角色／陣營（說書人手動換代幣）；新舞蛇人中毒；template 不強制寫死中毒",
      },
    ],
  },
  cerenovus: {
    id: "cerenovus",
    name: "洗腦師",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "目標玩家" },
          { key: "r1", type: "role", label: "對應角色" },
        ],
        sentence: {
          action: "洗腦",
          template: "{actor} → {action} → {p1} → {r1}",
        },
        effects: [
          rem("cerenovus", "瘋狂", "p1", { label: "目標玩家 瘋狂" }),
        ],
        notes: "說書人裁定；目標須瘋狂證明自己是該角色",
      },
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "目標玩家" },
        ],
        sentence: {
          action: "",
          template: "{p1}不夠瘋狂遭到處決",
        },
        effects: [
          ...kill("cerenovus", "p1", {
            defaultOn: true,
            label: "目標死亡",
          }),
        ],
        notes: "不夠瘋狂 → 可能被處決",
      },
    ],
  },
  juggler: {
    id: "juggler",
    name: "雜耍藝人",
    enabled: true,
    cards: [
      {
        key: "first-day",
        label: "firstDay",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: [], days: ["first"] },
        inputs: [
          { key: "guess", type: "text", label: "公開猜測（最多五次）" },
        ],
        sentence: {
          action: "猜測",
          template: "{actor} → 首日公開猜測 → {guess}",
        },
        effects: [],
        notes: "僅第一天白天；猜測過程可簡記",
      },
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: true,
        when: { nights: ["other"], days: [] },
        inputs: [{ key: "num", type: "number", label: "得知數字" }],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {num}",
        },
        effects: [
          rem("juggler", "正確", "actor", {
            label: "自身 正確",
            defaultOn: false,
          }),
        ],
        notes: "當晚回報猜對數",
      },
    ],
  },
  philosopher: {
    id: "philosopher",
    name: "哲學家",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: true,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "r1", type: "role", label: "善良角色" },
          {
            key: "p1",
            type: "player",
            label: "在場則醉酒的玩家（可空）",
          },
        ],
        sentence: {
          action: "選擇",
          template: "{actor} → {action} → [{r1}]",
        },
        effects: [
          rem("philosopher", "是哲學家", "actor", {
            label: "自身 是哲學家",
          }),
          rem("philosopher", "醉酒", "p1", {
            label: "在場角色玩家 醉酒",
            defaultOn: false,
          }),
        ],
        notes:
          "選善良角色；在場則對方醉酒；掛「是哲學家」標記（例句「成為」=獲其能力）",
      },
    ],
  },
  bonecollector: {
    id: "bonecollector",
    name: "集骨者",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: true,
        when: { nights: ["other"], days: [] },
        inputs: [
          { key: "target", type: "player", label: "死亡玩家" },
        ],
        sentence: {
          action: "選擇",
          template: "{actor} → {action} → 選擇 {target}",
        },
        effects: [
          rem("bonecollector", "具有能力", "target", {
            label: "目標對象 具有能力",
          }),
        ],
        notes: "至明昏恢復能力；每局一次；template 勿帶「死亡」結果句",
      },
    ],
  },
  sage: {
    id: "sage",
    name: "賢者",
    enabled: true,
    cards: [
      {
        key: "trigger",
        label: "trigger",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
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
    ],
  },
  sweetheart: {
    id: "sweetheart",
    name: "心上人",
    enabled: true,
    cards: [
      {
        key: "death",
        label: "death",
        enabled: true,
        activation: "optional",
        once: false,
        when: { nights: [], days: [] },
        inputs: [{ key: "p1", type: "player", label: "醉酒玩家" }],
        sentence: {
          action: "",
          template: "{actor}死亡 → {p1} 醉酒",
        },
        effects: [
          rem("sweetheart", "醉酒", "p1", { label: "目標玩家 醉酒" }),
        ],
        notes: "醉酒的是「另一名玩家」，非心上人自身",
      },
    ],
  },
  seamstress: {
    id: "seamstress",
    name: "女裁縫",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: true,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "p1", type: "player", label: "玩家 1" },
          { key: "p2", type: "player", label: "玩家 2" },
          {
            key: "res",
            type: "select",
            label: "結果判斷",
            options: ["相同", "不同"],
          },
        ],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {p1} & {p2} → {res}",
        },
        effects: [],
        notes: "每局一次；得知兩人是否同陣營",
      },
    ],
  },
  oracle: {
    id: "oracle",
    name: "神諭者",
    enabled: true,
    cards: [
      {
        key: "other-night",
        label: "otherNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["other"], days: [] },
        inputs: [{ key: "num", type: "number", label: "得知數字" }],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {num}",
        },
        effects: [],
        notes: "死亡玩家中邪惡數量",
      },
    ],
  },
  clockmaker: {
    id: "clockmaker",
    name: "鐘錶匠",
    enabled: true,
    cards: [
      {
        key: "first-night",
        label: "firstNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first"], days: [] },
        inputs: [{ key: "num", type: "number", label: "得知數字" }],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {num}",
        },
        effects: [],
        notes: "惡魔到最近爪牙距離（鄰座=1）",
      },
    ],
  },
  dreamer: {
    id: "dreamer",
    name: "築夢師",
    enabled: true,
    cards: [
      {
        key: "every-night",
        label: "everyNight",
        enabled: true,
        activation: null,
        once: false,
        when: { nights: ["first", "other"], days: [] },
        inputs: [
          { key: "p1", type: "otherPlayer", label: "目標玩家" },
          { key: "r1", type: "role", label: "善良角色" },
          { key: "r2", type: "role", label: "邪惡角色" },
        ],
        sentence: {
          action: "得知",
          template: "{actor} → {action} → {p1} → {r1} / {r2}",
        },
        effects: [],
        notes: "一善一邪角色，其一正確",
      },
    ],
  },
};

module.exports = { SNV_ROLE_DOCS };
