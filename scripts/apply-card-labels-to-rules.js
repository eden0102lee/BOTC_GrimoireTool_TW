/**
 * Migrate all roleInteractionRules → cards[] with camelCase LABELs.
 *
 * Spec (locked):
 *   setup | firstNight | everyNight | otherNight
 *   firstDay | everyDay
 *   optional | trigger | nominate | death | passive
 *   + once (flag, not a LABEL)
 *
 * Usage: node scripts/apply-card-labels-to-rules.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RULES_PATH = path.join(ROOT, "src", "store", "roleInteractionRules.json");
const DOCS_OUT = path.join(ROOT, "docs", "role-card-labels.md");

function slugify(label, index = 0) {
  const base = String(label || `card-${index}`)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9_\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `card-${index}`;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function emptyWhen() {
  return { nights: [], days: [] };
}

function whenForLabel(label) {
  switch (label) {
    case "firstNight":
      return { nights: ["first"], days: [] };
    case "everyNight":
      return { nights: ["first", "other"], days: [] };
    case "otherNight":
      return { nights: ["other"], days: [] };
    case "firstDay":
      return { nights: [], days: ["first"] };
    case "everyDay":
      return { nights: [], days: ["first", "other"] };
    default:
      return emptyWhen();
  }
}

function activationForLabel(label) {
  if (label === "setup") return "setup";
  if (label === "optional") return "optional";
  if (label === "trigger" || label === "nominate" || label === "death") {
    return "optional";
  }
  if (label === "passive") return "optional";
  return null;
}

function makeCard(spec, content = null) {
  const label = spec.label;
  const when = spec.when || whenForLabel(label);
  const base = content
    ? {
        inputs: clone(content.inputs || []),
        sentence: clone(
          content.sentence || { action: "選擇", template: "{actor} → {action}" },
        ),
        effects: clone(content.effects || []),
        notes: content.notes || "",
        enabled: content.enabled !== false,
      }
    : {
        inputs: clone(spec.inputs || []),
        sentence: clone(
          spec.sentence || { action: "選擇", template: "{actor} → {action}" },
        ),
        effects: clone(spec.effects || []),
        notes: spec.notes || "",
        enabled: true,
      };
  return {
    key: spec.key || slugify(label),
    label,
    enabled: base.enabled,
    activation:
      spec.activation !== undefined
        ? spec.activation
        : activationForLabel(label),
    once: !!spec.once,
    when,
    inputs: base.inputs,
    sentence: base.sentence,
    effects: base.effects,
    notes: base.notes || spec.notes || "",
  };
}

function contentFromRule(rule) {
  return {
    inputs: rule.inputs || [],
    sentence: rule.sentence || { action: "選擇", template: "{actor} → {action}" },
    effects: rule.effects || [],
    notes: rule.notes || "",
    enabled: rule.enabled !== false,
  };
}

/** Infer a single night/setup label from legacy fields. */
function inferLegacyLabel(rule) {
  if (rule.activation === "setup") return "setup";
  if (rule.activation === "optional") return "optional";
  if (rule.activation === "trigger") return "trigger";
  const nights = (rule.when && rule.when.nights) || [];
  const days = (rule.when && rule.when.days) || [];
  if (days.length === 1 && days[0] === "first") return "firstDay";
  if (days.length) return "everyDay";
  if (nights.includes("first") && nights.includes("other")) return "everyNight";
  if (nights.length === 1 && nights[0] === "first") return "firstNight";
  if (nights.length === 1 && nights[0] === "other") return "otherNight";
  if (!nights.length && !days.length) return "optional";
  return "everyNight";
}

/**
 * Single-card label overrides (event / day / passive).
 * Content stays on this one card.
 */
const SINGLE_OVERRIDES = {
  // day
  gunslinger: { label: "everyDay" },
  matron: { label: "everyDay" },
  // nominate
  virgin: { label: "nominate", once: true },
  judge: { label: "nominate", once: true },
  bishop: { label: "nominate" },
  // death
  ravenkeeper: { label: "death" },
  fool: { label: "death", once: true },
  klutz: { label: "death" },
  sweetheart: { label: "death" },
  sage: { label: "death" },
  barber: { label: "death" },
  moonchild: { label: "death" },
  // trigger
  scarletwoman: { label: "trigger" },
  saint: { label: "trigger" },
  goon: { label: "trigger" },
  tinker: { label: "trigger" },
  mayor: { label: "trigger" },
  mastermind: { label: "trigger" },
  minstrel: { label: "trigger" },
  // passive
  pacifist: { label: "passive" },
  tealady: { label: "passive" },
  soldier: { label: "passive" },
  // setup (ensure)
  drunk: { label: "setup", once: true },
  baron: { label: "setup", once: true },
  marionette: { label: "setup", once: true },
};

/**
 * Multi-card splits. `content: true` means put existing rule body on that card.
 * Other cards are stubs (notes / minimal inputs).
 */
const SPLITS = {
  imp: [
    { label: "otherNight", content: true },
    {
      label: "trigger",
      notes: "自殺轉生：爪牙成為小惡魔（可選紀錄）",
      sentence: {
        action: "自殺轉生",
        template: "{actor} → {action} → 爪牙成為小惡魔",
      },
      inputs: [],
    },
  ],
  godfather: [
    {
      label: "setup",
      once: true,
      notes: "開局：外來者數量變化",
      sentence: { action: "設置", template: "{actor} → {action} → 外來者數量變化" },
      inputs: [],
    },
    {
      label: "firstNight",
      notes: "首夜得知外來者是誰",
      sentence: {
        action: "得知",
        template: "{actor} → {action} → 外來者",
      },
      inputs: [],
    },
    { label: "otherNight", content: true },
  ],
  grandmother: [
    { label: "firstNight", content: true },
    {
      label: "death",
      notes: "孫子被惡魔殺死 → 祖母死亡",
      sentence: {
        action: "連坐",
        template: "{actor} → {action} → 孫子被惡魔殺死，自身死亡",
      },
      inputs: [],
      effects: [
        {
          id: "kill",
          type: "setDead",
          targetFrom: "actor",
          value: true,
          optional: true,
          defaultOn: true,
          label: "自身死亡",
        },
      ],
    },
  ],
  gossip: [
    {
      label: "everyDay",
      notes: "白天公開聲明一則事實",
      sentence: {
        action: "聲明",
        template: "{actor} → {action} → {note}",
      },
      inputs: [{ key: "note", type: "text", label: "聲明內容" }],
    },
    { label: "otherNight", content: true },
  ],
  fanggu: [
    {
      label: "setup",
      once: true,
      notes: "開局：+1 外來者",
      sentence: { action: "設置", template: "{actor} → {action} → +1 外來者" },
      inputs: [],
    },
    { label: "otherNight", content: true },
  ],
  vigormortis: [
    {
      label: "setup",
      once: true,
      notes: "開局：−1 外來者",
      sentence: { action: "設置", template: "{actor} → {action} → −1 外來者" },
      inputs: [],
    },
    { label: "otherNight", content: true },
  ],
  nodashii: [
    {
      label: "setup",
      once: true,
      notes: "開局：兩側最近鎮民中毒（座位／角色變動時需更新）",
      sentence: {
        action: "設置",
        template: "{actor} → {action} → 鄰座鎮民中毒",
      },
      inputs: [],
    },
    { label: "otherNight", content: true },
  ],
  eviltwin: [
    { label: "firstNight", content: true },
    {
      label: "trigger",
      notes: "善側雙子處決→邪勝；雙方皆活時善不能勝",
      sentence: {
        action: "觸發",
        template: "{actor} → {action} → {note}",
      },
      inputs: [{ key: "note", type: "text", label: "結果備註" }],
    },
  ],
  zombuul: [
    { label: "otherNight", content: true },
    {
      label: "death",
      notes: "第一次死亡不真正死（視為已死）",
      sentence: {
        action: "假死",
        template: "{actor} → {action} → 第一次死亡不真正死",
      },
      inputs: [],
    },
  ],
  vortox: [
    { label: "otherNight", content: true },
    {
      label: "trigger",
      notes: "白天無處決 → 邪惡獲勝；鎮民資訊必錯",
      sentence: {
        action: "觸發",
        template: "{actor} → {action} → 白天無處決，邪惡獲勝",
      },
      inputs: [],
    },
  ],
};

/** Already migrated P0 roles — normalize only. */
const KEEP_CARDS = new Set([
  "fortuneteller",
  "juggler",
  "savant",
  "slayer",
  "artist",
]);

function normalizeExistingCards(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    cards: (rule.cards || []).map((c, i) => {
      const label =
        c.label === "SETUP"
          ? "setup"
          : c.label === "everynight"
            ? "everyNight"
            : c.label;
      const when = c.when || whenForLabel(label);
      return {
        key: c.key || slugify(label, i),
        label,
        enabled: c.enabled !== false,
        activation:
          c.activation !== undefined && c.activation !== null
            ? c.activation
            : activationForLabel(label),
        once: !!c.once,
        when: {
          nights: Array.isArray(when.nights) ? when.nights : [],
          days: Array.isArray(when.days) ? when.days : [],
        },
        inputs: c.inputs || [],
        sentence: c.sentence || { action: "選擇", template: "{actor} → {action}" },
        effects: c.effects || [],
        notes: c.notes || "",
      };
    }),
  };
}

function migrateRule(rule) {
  if (KEEP_CARDS.has(rule.id) && Array.isArray(rule.cards) && rule.cards.length) {
    return normalizeExistingCards(rule);
  }
  if (Array.isArray(rule.cards) && rule.cards.length) {
    return normalizeExistingCards(rule);
  }

  const content = contentFromRule(rule);

  if (SPLITS[rule.id]) {
    const cards = SPLITS[rule.id].map((spec) => {
      if (spec.content) {
        // Fix nights on content card via label when
        return makeCard(
          {
            label: spec.label,
            once: spec.once || !!rule.once,
            key: slugify(spec.label),
          },
          {
            ...content,
            // Prefer split-specific nights from label
          },
        );
      }
      return makeCard({
        label: spec.label,
        once: !!spec.once,
        notes: spec.notes,
        sentence: spec.sentence,
        inputs: spec.inputs,
        effects: spec.effects,
        activation: spec.activation,
      });
    });
    return {
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled !== false,
      cards,
    };
  }

  const ov = SINGLE_OVERRIDES[rule.id];
  const label = ov ? ov.label : inferLegacyLabel(rule);
  const once = ov && ov.once !== undefined ? ov.once : !!rule.once;
  const card = makeCard(
    {
      label,
      once,
      key: slugify(label),
    },
    content,
  );
  // Preserve explicit activation from override path for setup
  if (label === "setup") card.activation = "setup";

  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    cards: [card],
  };
}

function stripLegacyTopLevel(doc) {
  // cards[] is source of truth; drop duplicated flat fields
  return {
    id: doc.id,
    name: doc.name,
    enabled: doc.enabled,
    cards: doc.cards,
  };
}

function buildDocs(rules) {
  const lines = [
    "# 角色互動規則 LABEL 對照",
    "",
    "依定稿 camelCase LABEL 整理（由 `scripts/apply-card-labels-to-rules.js` 產生）。",
    "",
    "## LABEL 一覽",
    "",
    "| LABEL | 戰報池 |",
    "|---|---|",
    "| `setup` | 開局設置 |",
    "| `firstNight` / `everyNight` / `otherNight` | 夜卡 |",
    "| `firstDay` / `everyDay` | 今日晝間能力 |",
    "| `optional` / `trigger` / `nominate` / `death` | 可選紀錄 |",
    "| `passive` | 通常不進池 |",
    "",
    "`once` 為旗標，不是 LABEL。",
    "",
    "## 全部角色",
    "",
    "| id | 名稱 | cards |",
    "|---|---|---|",
  ];
  for (const r of rules) {
    const labs = (r.cards || [])
      .map((c) => (c.once ? `${c.label}:once` : c.label))
      .join(" + ");
    lines.push(`| \`${r.id}\` | ${r.name || r.id} | ${labs} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const data = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
  const before = data.rules.length;
  const migrated = data.rules.map((r) => stripLegacyTopLevel(migrateRule(r)));

  // stats
  const labelCounts = {};
  let multi = 0;
  for (const r of migrated) {
    if (r.cards.length > 1) multi += 1;
    for (const c of r.cards) {
      labelCounts[c.label] = (labelCounts[c.label] || 0) + 1;
    }
  }

  data.rules = migrated;
  data.generatedAt = new Date().toISOString();
  data.labelSchema = "camelCase-v1";

  fs.writeFileSync(RULES_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.writeFileSync(DOCS_OUT, buildDocs(migrated), "utf8");

  console.log(`Migrated ${before} roles → cards[]`);
  console.log(`Multi-card roles: ${multi}`);
  console.log("Label counts:", labelCounts);
  console.log(`Wrote ${DOCS_OUT}`);
}

main();
