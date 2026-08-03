/**
 * Role-specific fill fields for the night recorder (Laplace-style).
 * Empty array = passive / no selectable night action card.
 */

const isRole = (role, ids, names = []) => {
  const id = (role.baseRoleId || role.id || "").toLowerCase();
  const name = role.name || "";
  return ids.includes(id) || names.some((n) => name.includes(n));
};

/**
 * @param {object} role
 * @returns {Array<{ key: string, type: string, label: string, options?: string[] }>}
 */
export function getRoleInputConfig(role) {
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
    isRole(
      role,
      ["washerwoman", "librarian", "investigator"],
      [
        "洗衣婦",
        "圖書管理員",
        "圖書館員",
        "調查員",
        "洗衣妇",
        "图书管理员",
        "图书馆员",
        "调查员",
      ],
    )
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      { key: "r1", type: "role", label: "對應角色" },
    ];
  }

  if (isRole(role, ["dreamer"], ["築夢師", "筑梦师"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      { key: "r1", type: "role", label: "善良角色" },
      { key: "r2", type: "role", label: "邪惡角色" },
    ];
  }

  if (
    isRole(
      role,
      [
        "cerenovus",
        "pit-hag",
        "kazali",
        "grandmother",
        "widow",
        "puzzlemaster",
        "jiaohuazi",
      ],
      [
        "洗腦師",
        "麻臉巫婆",
        "卡扎力",
        "卡紮力",
        "祖母",
        "寡婦",
        "解謎大師",
        "叫花子",
        "洗脑师",
        "麻脸巫婆",
        "寡妇",
        "解谜大师",
      ],
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
      [
        "chef",
        "empath",
        "mathematician",
        "shiguan",
        "fangshi",
        "clockmaker",
        "oracle",
        "juggler",
        "dagengren",
        "chambermaid",
      ],
      [
        "廚師",
        "共情者",
        "數學家",
        "史官",
        "方士",
        "鐘錶匠",
        "鐘表匠",
        "神諭者",
        "雜耍藝人",
        "打更人",
        "侍女",
        "厨师",
        "数学家",
        "钟表匠",
        "神谕者",
        "杂耍艺人",
      ],
    )
  ) {
    return [{ key: "num", type: "number", label: "得知數字" }];
  }

  if (
    isRole(role, ["fortune_teller", "seamstress"], [
      "占卜師",
      "女裁縫",
      "占卜师",
      "女裁缝",
    ])
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      {
        key: "res",
        type: "select",
        label: "結果判斷",
        options: ["是 (Yes)", "否 (No)"],
      },
    ];
  }

  if (isRole(role, ["noble"], ["貴族", "贵族"])) {
    return [
      { key: "p1", type: "player", label: "善良玩家 1" },
      { key: "p2", type: "player", label: "善良玩家 2" },
      { key: "evilTarget", type: "player", label: "邪惡玩家" },
    ];
  }

  if (
    isRole(role, ["al-hadikhia", "dianyuzhang", "yinluren"], [
      "哈迪寂亞",
      "典獄長",
      "引路人",
      "哈迪寂亚",
      "典狱长",
    ])
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
      { key: "p3", type: "player", label: "玩家 3" },
    ];
  }

  if (
    isRole(
      role,
      [
        "shabaloth",
        "harpy",
        "qianke",
        "evil_twin",
        "dianxiaoer",
        "knight",
        "baojun",
        "innkeeper",
        "barber",
        "xuncha",
        "jianning",
      ],
      [
        "沙巴洛斯",
        "鷹身女妖",
        "掮客",
        "鏡像雙子",
        "店小二",
        "騎士",
        "暴君",
        "旅店老闆",
        "旅店老板",
        "理髮師",
        "理發師",
        "巡察",
        "奸佞",
        "鹰身女妖",
        "镜像双子",
        "骑士",
        "理发师",
      ],
    )
  ) {
    return [
      { key: "p1", type: "player", label: "玩家 1" },
      { key: "p2", type: "player", label: "玩家 2" },
    ];
  }

  if (
    isRole(role, ["qintianjian", "fengshuishi", "shugenja", "gudiao"], [
      "欽天監",
      "風水師",
      "修行者",
      "蠱雕",
      "钦天监",
      "风水师",
      "蛊雕",
    ])
  ) {
    return [
      {
        key: "dir",
        type: "select",
        label: "方向",
        options: ["左/順時針", "右/逆時針", "相同"],
      },
    ];
  }

  if (isRole(role, ["langzhong", "niangjiushi"], ["郎中", "釀酒師", "酿酒师"])) {
    return [
      { key: "p1", type: "player", label: "目標對象" },
      { key: "word", type: "text", label: "給予提示詞/信息" },
    ];
  }

  if (
    isRole(
      role,
      [
        "zhen",
        "xionghaizi",
        "ojo",
        "courtier",
        "pixie",
        "alchemist",
        "daoke",
        "bianlianshi",
      ],
      [
        "鴆",
        "熊孩子",
        "奧赫",
        "侍臣",
        "小精靈",
        "煉金術士",
        "刀客",
        "變臉師",
        "鸩",
        "奥赫",
        "小精灵",
        "炼金术士",
        "变脸师",
      ],
    )
  ) {
    return [{ key: "r1", type: "role", label: "選擇角色" }];
  }

  if (isRole(role, ["village_idiot"], ["村夫"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      {
        key: "res",
        type: "select",
        label: "該玩家陣營",
        options: ["善良 (Good)", "邪惡 (Evil)"],
      },
    ];
  }

  if (isRole(role, ["general"], ["將軍", "将军"])) {
    return [
      {
        key: "res",
        type: "select",
        label: "優勢陣營",
        options: ["善良", "邪惡", "均勢"],
      },
    ];
  }

  if (isRole(role, ["mengpo"], ["孟婆"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      {
        key: "res",
        type: "select",
        label: "該玩家選擇",
        options: ["失去能力", "保留能力並死亡"],
      },
    ];
  }

  if (
    isRole(role, ["jinweijun2"], [
      "禁衛軍Ⅱ",
      "禁衛軍2",
      "禁卫军Ⅱ",
      "禁卫军2",
    ])
  ) {
    return [
      {
        key: "res",
        type: "select",
        label: "禁衛軍選擇",
        options: ["求生", "求死"],
      },
    ];
  }

  if (isRole(role, ["organ_grinder"], ["街頭風琴手", "街头风琴手"])) {
    return [
      {
        key: "res",
        type: "select",
        label: "是否醉酒",
        options: ["是 (醉酒)", "否 (清醒)"],
      },
    ];
  }

  if (isRole(role, ["barista"], ["咖啡師", "咖啡师"])) {
    return [
      { key: "p1", type: "player", label: "目標玩家" },
      {
        key: "res",
        type: "select",
        label: "附加效果",
        options: ["解除醉酒中毒", "能力發動兩次"],
      },
    ];
  }

  if (
    isRole(
      role,
      [
        "mezepheles",
        "yaggababble",
        "savant",
        "artist",
        "wizard",
        "chongfei",
        "taotie",
      ],
      [
        "靈言師",
        "牙噶巴卜",
        "博學者",
        "藝術家",
        "巫師",
        "寵妃",
        "饕餮",
        "灵言师",
        "博学者",
        "艺术家",
        "巫师",
        "宠妃",
      ],
    )
  ) {
    return [{ key: "word", type: "text", label: "記錄詞語/短語/問題" }];
  }

  if (
    isRole(role, ["flowergirl", "town_crier", "zhifu", "yishi"], [
      "賣花女孩",
      "城鎮公告員",
      "知府",
      "驛使",
      "卖花女孩",
      "城镇公告员",
      "驿使",
    ])
  ) {
    return [
      {
        key: "res",
        type: "select",
        label: "結果",
        options: ["是 (Yes)", "否 (No)"],
      },
    ];
  }

  // Passive / no form — skip night action card
  if (
    isRole(
      role,
      [
        "banshee",
        "zealot",
        "xaan",
        "wraith",
        "princess",
        "hermit",
        "soldier",
        "mayor",
        "drunk",
        "saint",
        "recluse",
        "scarlet_woman",
        "baron",
        "mastermind",
        "deviant",
        "butcher",
        "mutant",
        "sweetheart",
        "atheist",
        "cannibal",
        "snitch",
        "damsel",
        "heretic",
        "politician",
        "boomdandy",
        "marionette",
        "leviathan",
        "vizier",
        "beggar",
        "scapegoat",
      ],
      [
        "報喪女妖",
        "狂熱者",
        "士兵",
        "鎮長",
        "市長",
        "酒鬼",
        "聖徒",
        "陌客",
        "紅唇女郎",
        "猩紅女郎",
        "男爵",
        "主謀",
        "怪咖",
        "屠夫",
        "畸形秀演員",
        "心上人",
        "無神論者",
        "食人族",
        "告密者",
        "落難少女",
        "異端分子",
        "政客",
        "炸彈人",
        "提線木偶",
        "利維坦",
        "維齊爾",
        "乞丐",
        "替罪羊",
        "报丧女妖",
        "狂热者",
        "镇长",
        "市长",
        "圣徒",
        "红唇女郎",
        "猩红女郎",
        "主谋",
        "畸形秀演员",
        "无神论者",
        "落难少女",
        "异端分子",
        "炸弹人",
        "提线木偶",
        "利维坦",
        "维齐尔",
      ],
    )
  ) {
    return [];
  }

  // Default: pick a player target (Imp, Monk, Poisoner, …)
  return [{ key: "target", type: "player", label: "目標對象" }];
}

/** Whether this role wakes / has a fillable card tonight. */
export function roleHasNightAction(role, isFirstNight) {
  if (!role || !role.id) return false;
  const order = isFirstNight ? role.firstNight : role.otherNight;
  if (!order) return false;
  return getRoleInputConfig(role).length > 0;
}

export function formatPlayerRoleLabel(player, fallbackSeat) {
  const name =
    (player && player.name) ||
    (fallbackSeat != null ? `座位 ${fallbackSeat + 1}` : "未知");
  const roleName =
    player && player.role && (player.role.name || player.role.id)
      ? player.role.name || player.role.id
      : "未指派";
  return `${name}[${roleName}]`;
}

export function buildRoleCardKey(phaseId, playerIndex, roleId) {
  return `${phaseId}|${playerIndex}|${roleId || ""}`;
}
