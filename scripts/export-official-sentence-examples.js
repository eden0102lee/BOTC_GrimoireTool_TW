/**
 * Export official-edition role sentence examples for ST review.
 * Uses the same concise style as battleLogFormat.buildNaturalRoleMessage:
 * short verb (default 選擇) + targets; └ result lines from effects.
 *
 * Usage: node scripts/export-official-sentence-examples.js [tb|bmr|snv|all]
 */
const fs = require("fs");
const path = require("path");
const { OVERRIDES } = require("./export-official-skill-cards.js");

const ROOT = path.join(__dirname, "..");
const ROLES_PATH = path.join(ROOT, "src/roles.json");
const RULES_PATH = path.join(ROOT, "src/store/roleInteractionRules.json");
const OUT_DIR = path.join(ROOT, "docs");

const EDITION = (process.argv[2] || "tb").toLowerCase();
const EDITIONS =
  EDITION === "all" ? ["tb", "bmr", "snv"] : [EDITION];

function formatSeat(i) {
  return String(i + 1).padStart(2, "0");
}

function playerLabel(name, seat, roleName) {
  return `${name}【${formatSeat(seat)}.${roleName}】`;
}

function resolveActionVerb(rule, effectSpecs) {
  let action = (rule.sentence && rule.sentence.action) || "選擇";
  if (action === "使用能力") action = "選擇";
  if (action !== "選擇") return action;

  const template = (rule.sentence && rule.sentence.template) || "";
  const effects = effectSpecs || rule.effects || [];
  if (
    template.includes("中毒") ||
    effects.some((e) => e.type === "addReminder" && e.reminderName === "中毒")
  ) {
    return "投毒";
  }
  if (
    template.includes("死亡") ||
    effects.some((e) => e.type === "setDead" && e.value !== false)
  ) {
    return "殺害";
  }
  if (
    template.includes("保護") ||
    effects.some((e) => e.type === "addReminder" && e.reminderName === "保護")
  ) {
    return "保護";
  }
  return "選擇";
}

function sampleForm(rule, actorRoleName) {
  const fd = {};
  const names = ["小明", "小美", "小強", "小芳"];
  const roles = ["洗衣婦", "僧侶", "士兵", "廚師"];
  let pi = 0;
  (rule.inputs || []).forEach((input) => {
    if (["player", "alivePlayer", "otherPlayer"].includes(input.type)) {
      const seat =
        rule.activation === "setup" && input.key === "p1" ? 0 : pi + 2;
      const bluff =
        rule.activation === "setup" && input.key === "p1" ? "獵手" : roles[pi % roles.length];
      const pname =
        rule.activation === "setup" && input.key === "p1" ? "小華" : names[pi % names.length];
      fd[input.key] = playerLabel(pname, seat, bluff);
      if (!(rule.activation === "setup" && input.key === "p1")) pi += 1;
    } else if (input.type === "role") {
      fd[input.key] = "洗衣婦";
    } else if (input.type === "number") {
      fd[input.key] = "2";
    } else if (input.type === "select") {
      fd[input.key] =
        (input.options && input.options[0]) || "是";
    } else if (input.type === "text") {
      fd[input.key] = "（備註）";
    }
  });
  return fd;
}

function samplePlayers(rule, actorRoleName, formData) {
  const players = [
    { name: "小華", role: { name: actorRoleName, id: rule.id }, isDead: false },
  ];
  const used = new Set();
  Object.values(formData).forEach((val) => {
    const m = String(val).match(/^(.+)【(\d{2})\.(.+)】$/);
    if (!m) return;
    const seat = parseInt(m[2], 10) - 1;
    used.add(seat);
    while (players.length <= seat) {
      players.push({ name: `座位${players.length + 1}`, role: { name: "未指派" }, isDead: false });
    }
    players[seat] = {
      name: m[1],
      role: { name: m[3] },
      isDead: false,
    };
  });
  return players;
}

function resolvePlayerIndex(players, label) {
  const target = String(label || "").trim();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const lab = playerLabel(
      p.name,
      i,
      (p.role && p.role.name) || "未指派",
    );
    if (lab === target) return i;
  }
  const seatMatch = target.match(/【(\d{1,2})\./);
  if (seatMatch) {
    const seat = parseInt(seatMatch[1], 10);
    if (seat >= 1 && seat <= players.length) return seat - 1;
  }
  return -1;
}

function defaultOnEffects(rule, formData, players) {
  const out = [];
  const deadSeats = new Set();
  (rule.effects || []).forEach((spec) => {
    if (spec.optional && spec.defaultOn === false) return;
    let playerIndex = -1;
    if (spec.targetFrom === "actor" || spec.targetFrom === "__actor__") {
      playerIndex = 0;
    } else if (spec.targetFrom && formData[spec.targetFrom]) {
      playerIndex = resolvePlayerIndex(players, formData[spec.targetFrom]);
    }
    if (
      playerIndex < 0 &&
      spec.targetFrom &&
      spec.targetFrom !== "actor" &&
      spec.targetFrom !== "__actor__"
    ) {
      return;
    }
    if (spec.type === "setDead" && spec.value !== false) {
      deadSeats.add(playerIndex);
      out.push({ type: "setDead", playerIndex, value: true });
    } else if (spec.type === "setRevive") {
      out.push({ type: "setRevive", playerIndex });
    } else if (spec.type === "setAbilityLost") {
      out.push({ type: "setAbilityLost", playerIndex });
    } else if (spec.type === "addReminder") {
      out.push({
        type: "addReminder",
        playerIndex,
        reminder: { name: spec.reminderName || "提醒" },
        reminderName: spec.reminderName,
      });
    } else if (spec.type === "removeReminder") {
      out.push({
        type: "removeReminder",
        playerIndex,
        reminder: { name: spec.reminderName || "提醒" },
      });
    }
  });
  return { effects: out, deadSeats };
}

function formatResultLines(effects, players) {
  const deadSeats = new Set();
  effects.forEach((e) => {
    if (e.type === "setDead" && e.value !== false) deadSeats.add(e.playerIndex);
  });
  const lines = [];
  const seen = new Set();
  effects.forEach((e) => {
    const p = players[e.playerIndex];
    const label = p
      ? playerLabel(p.name, e.playerIndex, (p.role && p.role.name) || "未指派")
      : `座位 ${(e.playerIndex || 0) + 1}`;
    let text = null;
    if (e.type === "setDead") {
      text = e.value === false ? `${label}復活` : `${label}死亡`;
    } else if (e.type === "setRevive") {
      text = `${label}復活`;
    } else if (e.type === "setAbilityLost") {
      text = `${label}失去能力`;
    } else if (e.type === "addReminder") {
      const name = (e.reminder && e.reminder.name) || e.reminderName || "";
      if (!name) return;
      if (name === "死亡" && deadSeats.has(e.playerIndex)) return;
      text = `${label}${name}`;
    } else if (e.type === "removeReminder") {
      const name = (e.reminder && e.reminder.name) || "";
      if (name) text = `${label}移除${name}`;
    }
    if (text && !seen.has(text)) {
      seen.add(text);
      lines.push(`└ ${text}`);
    }
  });
  return lines;
}

function interpolateTemplate(template, fd, actorLabel) {
  let main = template;
  main = main.replace(/\{actor\}/g, actorLabel);
  Object.entries(fd).forEach(([k, v]) => {
    main = main.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  });
  return main;
}

function buildExample(rule) {
  const name = rule.name || rule.id;
  const fd = sampleForm(rule, name);
  const players = samplePlayers(rule, name, fd);
  const action = resolveActionVerb(rule, rule.effects);
  const actorLabel = playerLabel("小華", 0, name);

  if (rule.activation === "setup") {
    const tpl = (rule.sentence && rule.sentence.template) || "";
    const main = tpl
      ? interpolateTemplate(tpl, fd, actorLabel)
      : `${actorLabel}${action}`;
    return { action, example: main, effects: [] };
  }

  const { effects } = defaultOnEffects(rule, fd, players);

  let main = "";
  const join = (...xs) => xs.filter(Boolean).join(" ");

  if (action === "得知" && fd.num != null && String(fd.num).trim() !== "") {
    main = `${playerLabel("小華", 0, name)}得知 [${fd.num}]`;
  } else if (fd.res && fd.p1 && fd.p2) {
    main = `${playerLabel("小華", 0, name)}查驗 ${join(fd.p1, fd.p2)}得知 [${fd.res}]`;
  } else if (fd.res) {
    main = `${playerLabel("小華", 0, name)}得知 [${fd.res}]`;
  } else if (fd.p1 && fd.p2 && fd.r1) {
    main = `${playerLabel("小華", 0, name)}得知 ${join(fd.p1, fd.p2)}其中一位是 [${fd.r1}]`;
  } else if (fd.p1 && fd.p2 && fd.p3) {
    main = `${playerLabel("小華", 0, name)}${action} ${join(fd.p1, fd.p2, fd.p3)}`;
  } else if (fd.p1 && fd.p2) {
    main = `${playerLabel("小華", 0, name)}${action} ${join(fd.p1, fd.p2)}`;
  } else if (fd.p1 && fd.r1 && fd.r2) {
    main = `${playerLabel("小華", 0, name)}${action} ${fd.p1} [${fd.r1}] / [${fd.r2}]`;
  } else if (fd.p1 && fd.r1) {
    main = `${playerLabel("小華", 0, name)}${action} ${fd.p1} [${fd.r1}]`;
  } else if (fd.target) {
    main = `${playerLabel("小華", 0, name)}${action} ${fd.target}`;
  } else if (fd.r1) {
    main = `${playerLabel("小華", 0, name)}${action} [${fd.r1}]`;
  } else if (fd.word) {
    main = `${playerLabel("小華", 0, name)}${action} [${fd.word}]`;
  } else if (fd.note) {
    main = `${playerLabel("小華", 0, name)}${action} [${fd.note}]`;
  } else {
    main = `${playerLabel("小華", 0, name)}${action}`;
  }

  const results = formatResultLines(effects, players);
  const example = results.length ? [main, ...results].join("\n") : main;
  return { action, example, effects };
}

function main() {
  const roles = JSON.parse(fs.readFileSync(ROLES_PATH, "utf8"));
  const rulesDoc = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const ruleMap = new Map(
    (rulesDoc.rules || []).map((r) => [r.id.toLowerCase(), r]),
  );

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  EDITIONS.forEach((ed) => {
    const list = roles
      .filter((r) => r.edition === ed)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "zh"));

    let md = `# 官方角色戰報例句審核（${ed.toUpperCase()}）\n\n`;
    md += `> 自動產生：\`node scripts/export-official-sentence-examples.js ${ed}\`  \n`;
    md += `> 產生時間：${new Date().toISOString().slice(0, 10)}  \n`;
    md += `> 句式：短動詞（預設「選擇」）+ 對象；結果以 \`└\` 換行。審核後請改 \`sentence.action\`／effects。\n\n`;
    md += `| 狀態 | 說明 |\n| --- | --- |\n| ⬜ | 待審 |\n| ✅ | 例句 OK |\n| ✏️ | 需改句（填備註） |\n\n`;

    list.forEach((role) => {
      const rule = ruleMap.get(role.id.toLowerCase());
      md += `### ${role.name || role.id} (\`${role.id}\`)\n\n`;
      if (!rule) {
        md += `- 狀態：⬜（無互動規則）\n\n`;
        return;
      }
      const { action, example, effects } = buildExample(rule);
      const effectLabels = (rule.effects || [])
        .map((e) => e.label || `${e.type}:${e.reminderName || ""}`)
        .filter(Boolean)
        .join("、") || "（無）";
      md += `- 狀態：⬜\n`;
      md += `- action：\`${action}\`（規則原始：\`${(rule.sentence && rule.sentence.action) || ""}\`）\n`;
      md += `- template：\`${(rule.sentence && rule.sentence.template) || ""}\`\n`;
      md += `- effects：${effectLabels}\n`;
      md += `- **例句**：\n\n\`\`\`\n${example}\n\`\`\`\n`;
      md += `- 備註／改句：\n\n`;
    });

    const outPath = path.join(OUT_DIR, `official-sentence-review-${ed}.md`);
    fs.writeFileSync(outPath, md, "utf8");
    console.log(`Wrote ${outPath} (${list.length} roles)`);

    let editMd = `# ${ed.toUpperCase()} 戰報例句（直接修改）\n\n`;
    editMd += `> 已與 \`docs/official-skill-cards-${ed}.md\` 同步（${new Date().toISOString().slice(0, 10)}）。  \n`;
    editMd += `> 只改各角色下方 code block。改完整檔覆蓋後告知套用。  \n`;
    editMd += `> 格式：\`### id | 中文名\` 勿改 id。無戰報寫 \`(無)\`。\n\n`;

    list.forEach((role) => {
      const rule = ruleMap.get(role.id.toLowerCase());
      editMd += `### ${role.id} | ${role.name || role.id}\n`;
      if (!rule) {
        editMd += "```\n(無)\n```\n\n";
        return;
      }
      const ov = OVERRIDES[role.id.toLowerCase()];
      const example =
        (ov && ov.example) || buildExample(rule).example;
      editMd += "```\n" + example + "\n```\n\n";
    });

    const editPath = path.join(OUT_DIR, `official-sentence-edit-${ed}.md`);
    fs.writeFileSync(editPath, editMd, "utf8");
    console.log(`Wrote ${editPath} (${list.length} roles)`);
  });
}

main();
