import { formatPlayerRoleLabel } from "./roleInputConfig";

export const FACT_TYPES = {
  DEATH: "death",
  REVIVE: "revive",
  DEAD_VOTE: "deadVote",
  EVENT_POISON: "eventPoison",
  EVENT_DRUNK: "eventDrunk",
  IDENTITY_DRUNK: "identityDrunk",
  ABILITY_LOST: "abilityLost",
  REMOVE_POISON: "removePoison",
  REMOVE_DRUNK: "removeDrunk",
  REMOVE_IDENTITY_DRUNK: "removeIdentityDrunk",
  REMOVE_DEAD_VOTE: "removeDeadVote",
};

const POISON_NAMES = ["中毒"];
const DRUNK_NAMES = ["醉酒"];
const MAD_NAMES = ["瘋狂"];

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

export function playerLabel(player, index) {
  return formatPlayerRoleLabel(player, index);
}

export function resolvePlayerIndex(players, labelOrName) {
  if (!labelOrName || !players || !players.length) return -1;
  const target = String(labelOrName).trim();
  for (let i = 0; i < players.length; i++) {
    const lab = playerLabel(players[i], i);
    if (lab === target || players[i].name === target) return i;
  }
  return -1;
}

export function isMadReminder(reminder) {
  if (!reminder) return false;
  const name = reminder.name || "";
  return MAD_NAMES.some((n) => name.includes(n));
}

export function isPoisonReminder(reminder) {
  if (!reminder) return false;
  const name = reminder.name || "";
  return POISON_NAMES.some((n) => name.includes(n));
}

export function isDrunkReminder(reminder) {
  if (!reminder) return false;
  const name = reminder.name || "";
  return DRUNK_NAMES.some((n) => name.includes(n));
}

export function isIdentityDrunkReminder(reminder) {
  return isDrunkReminder(reminder) && reminder.role === "drunk";
}

export function reminderFactTypeForAdd(reminder) {
  if (isPoisonReminder(reminder)) return FACT_TYPES.EVENT_POISON;
  if (isIdentityDrunkReminder(reminder)) return FACT_TYPES.IDENTITY_DRUNK;
  if (isDrunkReminder(reminder)) return FACT_TYPES.EVENT_DRUNK;
  if (isMadReminder(reminder)) return "mad";
  return null;
}

export function reminderFactTypeForRemove(reminder) {
  if (isPoisonReminder(reminder)) return FACT_TYPES.REMOVE_POISON;
  if (isIdentityDrunkReminder(reminder)) return FACT_TYPES.IDENTITY_DRUNK;
  if (isDrunkReminder(reminder)) return FACT_TYPES.REMOVE_DRUNK;
  return null;
}

export function makeBattleLogReminder(name, roleId = "battleLog") {
  return {
    role: roleId,
    name,
    imageAlt: roleId,
  };
}

/** Build board effects from manual card tokens */
export function effectsFromManualTokens(tokens, players) {
  if (!Array.isArray(tokens) || !tokens.length) return [];
  const effects = [];
  const playerLabels = tokens
    .filter(
      (t) =>
        (t.type === "player" ||
          t.type === "alivePlayer" ||
          t.type === "otherPlayer") &&
        t.value,
    )
    .map((t) => String(t.value).trim());
  const statuses = tokens
    .filter((t) => t.type === "status" && t.value)
    .map((t) => String(t.value).trim());
  const roles = tokens
    .filter((t) => t.type === "role" && t.value)
    .map((t) => ({
      name: String(t.value).trim(),
      roleId: t.roleId || null,
    }));

  const primaryPlayer =
    playerLabels.length > 0
      ? resolvePlayerIndex(players, playerLabels[0])
      : -1;

  statuses.forEach((status) => {
    const targets =
      playerLabels.length > 0
        ? playerLabels
        : primaryPlayer >= 0
          ? [playerLabels[0]]
          : [];
    const indices =
      targets.length > 0
        ? targets.map((l) => resolvePlayerIndex(players, l)).filter((i) => i >= 0)
        : primaryPlayer >= 0
          ? [primaryPlayer]
          : [];

    indices.forEach((playerIndex) => {
      switch (status) {
        case "死亡":
          effects.push({ type: "setDead", playerIndex, value: true });
          break;
        case "復活":
          effects.push({ type: "setRevive", playerIndex });
          break;
        case "失去能力":
          effects.push({ type: "setAbilityLost", playerIndex, value: true });
          break;
        case "中毒":
          effects.push({
            type: "addReminder",
            playerIndex,
            reminder: makeBattleLogReminder("中毒"),
            factType: FACT_TYPES.EVENT_POISON,
          });
          break;
        case "醉酒": {
          const hasDrunkRole = roles.some((r) => r.roleId === "drunk");
          effects.push({
            type: "addReminder",
            playerIndex,
            reminder: makeBattleLogReminder("醉酒", hasDrunkRole ? "drunk" : "battleLog"),
            factType: hasDrunkRole
              ? FACT_TYPES.IDENTITY_DRUNK
              : FACT_TYPES.EVENT_DRUNK,
          });
          break;
        }
        case "瘋狂":
          effects.push({
            type: "addReminder",
            playerIndex,
            reminder: makeBattleLogReminder("瘋狂"),
          });
          break;
        default:
          break;
      }
    });
  });

  // Role-only identity entries (e.g. 酒鬼 setup)
  if (roles.some((r) => r.roleId === "drunk") && primaryPlayer >= 0) {
    const hasDrunkStatus = statuses.includes("醉酒");
    if (!hasDrunkStatus) {
      effects.push({
        type: "addReminder",
        playerIndex: primaryPlayer,
        reminder: makeBattleLogReminder("醉酒", "drunk"),
        factType: FACT_TYPES.IDENTITY_DRUNK,
      });
    }
  }

  return effects;
}

export function effectsFromDeadVote(players, selectedLabels) {
  const effects = [];
  (selectedLabels || []).forEach((label) => {
    const idx = resolvePlayerIndex(players, label);
    if (idx >= 0) {
      effects.push({ type: "setVoteless", playerIndex: idx, value: true });
    }
  });
  return effects;
}

export function effectsFromEntry(entry, players) {
  if (!entry) return [];
  if (entry.category === "deadVote" && entry.formSnapshot) {
    return effectsFromDeadVote(
      players,
      entry.formSnapshot.players || [],
    );
  }
  if (entry.category === "status" && entry.action) {
    const idx = resolvePlayerIndex(
      players,
      entry.actor || entry.target || entry.playerName,
    );
    if (idx < 0) return [];
    return effectsFromManualTokens(
      [
        { type: "player", value: playerLabel(players[idx], idx) },
        { type: "status", value: entry.action },
      ],
      players,
    );
  }
  if (entry.formSnapshot && entry.formSnapshot.tokens) {
    return effectsFromManualTokens(entry.formSnapshot.tokens, players);
  }
  if (entry.effects && entry.effects.length) return entry.effects.slice();
  return [];
}

export function factTypesFromEffects(effects) {
  const types = new Set();
  (effects || []).forEach((e) => {
    switch (e.type) {
      case "setDead":
        types.add(e.value ? FACT_TYPES.DEATH : FACT_TYPES.REVIVE);
        break;
      case "setRevive":
        types.add(FACT_TYPES.REVIVE);
        break;
      case "setVoteless":
        types.add(
          e.value ? FACT_TYPES.DEAD_VOTE : FACT_TYPES.REMOVE_DEAD_VOTE,
        );
        break;
      case "setAbilityLost":
        if (e.value) types.add(FACT_TYPES.ABILITY_LOST);
        break;
      case "addReminder":
        if (e.factType) types.add(e.factType);
        else if (isPoisonReminder(e.reminder))
          types.add(FACT_TYPES.EVENT_POISON);
        else if (isIdentityDrunkReminder(e.reminder))
          types.add(FACT_TYPES.IDENTITY_DRUNK);
        else if (isDrunkReminder(e.reminder))
          types.add(FACT_TYPES.EVENT_DRUNK);
        break;
      case "removeReminder":
        if (e.factType) types.add(e.factType);
        break;
      default:
        break;
    }
  });
  return types;
}

export function matchPending(pending, effects, playerIndex) {
  const types = factTypesFromEffects(effects);
  const typeMatches =
    types.has(pending.factType) ||
    (pending.factType === FACT_TYPES.IDENTITY_DRUNK &&
      types.has(FACT_TYPES.EVENT_DRUNK));
  if (!typeMatches) return false;
  if (pending.playerIndex !== playerIndex && pending.playerIndex != null) {
    return false;
  }
  for (const e of effects) {
    if (e.playerIndex === pending.playerIndex || pending.playerIndex == null) {
      const eTypes = factTypesFromEffects([e]);
      if (
        eTypes.has(pending.factType) ||
        (pending.factType === FACT_TYPES.IDENTITY_DRUNK &&
          eTypes.has(FACT_TYPES.EVENT_DRUNK))
      ) {
        return true;
      }
    }
  }
  return false;
}

function entryTargetsPlayer(tokens, pending, players) {
  const playerTokens = (tokens || []).filter(
    (t) =>
      (t.type === "player" ||
        t.type === "alivePlayer" ||
        t.type === "otherPlayer") &&
      t.value,
  );
  if (!playerTokens.length) return pending.playerIndex == null;
  return playerTokens.some(
    (t) => resolvePlayerIndex(players, t.value) === pending.playerIndex,
  );
}

/** Match pending from manual card tokens even when effects were not derived */
export function tokensResolvePending(tokens, pending, players) {
  if (!Array.isArray(tokens) || !tokens.length) return false;
  if (!entryTargetsPlayer(tokens, pending, players)) return false;

  const statuses = tokens
    .filter((t) => t.type === "status" && t.value)
    .map((t) => String(t.value).trim());
  const roleIds = tokens
    .filter((t) => t.type === "role" && t.roleId)
    .map((t) => t.roleId);

  switch (pending.factType) {
    case FACT_TYPES.DEATH:
      return statuses.includes("死亡");
    case FACT_TYPES.REVIVE:
      return statuses.includes("復活");
    case FACT_TYPES.ABILITY_LOST:
      return statuses.includes("失去能力");
    case FACT_TYPES.EVENT_POISON:
      return statuses.includes("中毒");
    case FACT_TYPES.EVENT_DRUNK:
      return statuses.includes("醉酒");
    case FACT_TYPES.IDENTITY_DRUNK:
      return statuses.includes("醉酒") || roleIds.includes("drunk");
    case "mad":
      return statuses.includes("瘋狂");
    default:
      if (pending.reminderName === "瘋狂") {
        return statuses.includes("瘋狂");
      }
      return false;
  }
}

export function deadVoteEntryResolvesPending(entry, pending, players) {
  if (pending.factType !== FACT_TYPES.DEAD_VOTE) return false;
  const names = (entry && entry.formSnapshot && entry.formSnapshot.players) || [];
  if (pending.playerIndex >= 0) {
    return names.some(
      (n) => resolvePlayerIndex(players, n) === pending.playerIndex,
    );
  }
  return names.some(
    (n) =>
      n === pending.playerName ||
      resolvePlayerIndex(players, n) === pending.playerIndex,
  );
}

/** Whether a written battle log entry clears an open pending fact */
export function pendingResolvedByEntry(pending, entry, effects, players) {
  if (matchPending(pending, effects || [], pending.playerIndex)) return true;

  const derived = effectsFromEntry(entry, players);
  if (derived.length && matchPending(pending, derived, pending.playerIndex)) {
    return true;
  }

  const tokens =
    entry && entry.formSnapshot && entry.formSnapshot.tokens
      ? entry.formSnapshot.tokens
      : null;
  if (tokens && tokensResolvePending(tokens, pending, players)) return true;

  if (
    entry &&
    entry.category === "deadVote" &&
    deadVoteEntryResolvesPending(entry, pending, players)
  ) {
    return true;
  }

  return false;
}

export function previewEffectsFromTokens(tokens, players) {
  return effectsFromManualTokens(tokens, players).map((e) => ({
    ...e,
    preview: true,
  }));
}

export function createPendingFact({
  playerIndex,
  playerName,
  factType,
  phaseId,
  boardPayload = null,
  recommend = null,
}) {
  return {
    id: newId(),
    playerIndex,
    playerName,
    factType,
    phaseId,
    status: "open",
    resolvedByEntryId: null,
    recommend,
    boardPayload,
    createdAt: new Date().toISOString(),
  };
}

export function pendingLabelKey(factType) {
  switch (factType) {
    case FACT_TYPES.DEATH:
      return "recorder.pendingDeath";
    case FACT_TYPES.REVIVE:
      return "recorder.pendingRevive";
    case FACT_TYPES.DEAD_VOTE:
      return "recorder.pendingDeadVote";
    case FACT_TYPES.EVENT_POISON:
      return "recorder.pendingPoison";
    case FACT_TYPES.EVENT_DRUNK:
      return "recorder.pendingDrunk";
    case FACT_TYPES.IDENTITY_DRUNK:
      return "recorder.pendingIdentityDrunk";
    case FACT_TYPES.ABILITY_LOST:
      return "recorder.pendingAbilityLost";
    case FACT_TYPES.REMOVE_POISON:
      return "recorder.pendingRemovePoison";
    case FACT_TYPES.REMOVE_DRUNK:
      return "recorder.pendingRemoveDrunk";
    default:
      return "recorder.pendingGeneric";
  }
}

export function recommendForPending(fact, players, rootState) {
  const label =
    fact.playerName ||
    (fact.playerIndex >= 0 && players[fact.playerIndex]
      ? playerLabel(players[fact.playerIndex], fact.playerIndex)
      : "");

  if (fact.factType === FACT_TYPES.DEAD_VOTE) {
    return {
      card: "deadVote",
      prefill: { players: label ? [label] : [] },
    };
  }
  if (fact.factType === FACT_TYPES.DEATH) {
    return {
      card: "manual",
      prefill: {
        tokens: [
          { type: "player", value: label },
          { type: "status", value: "死亡" },
        ],
      },
    };
  }
  if (fact.factType === FACT_TYPES.REVIVE) {
    return {
      card: "manual",
      prefill: {
        tokens: [
          { type: "player", value: label },
          { type: "status", value: "復活" },
        ],
      },
    };
  }
  if (fact.factType === FACT_TYPES.IDENTITY_DRUNK) {
    const drunkRole =
      rootState.roles && rootState.roles.get
        ? rootState.roles.get("drunk")
        : null;
    const tokens = [
      { type: "player", value: label },
      { type: "role", value: drunkRole?.name || "酒鬼", roleId: "drunk" },
      { type: "status", value: "醉酒" },
    ];
    return { card: "manual", prefill: { tokens } };
  }
  if (fact.factType === FACT_TYPES.EVENT_POISON) {
    return {
      card: "manual",
      prefill: {
        tokens: [
          { type: "player", value: label },
          { type: "status", value: "中毒" },
        ],
      },
    };
  }
  if (fact.factType === FACT_TYPES.EVENT_DRUNK) {
    return {
      card: "manual",
      prefill: {
        tokens: [
          { type: "player", value: label },
          { type: "status", value: "醉酒" },
        ],
      },
    };
  }
  if (fact.factType === FACT_TYPES.ABILITY_LOST) {
    return {
      card: "manual",
      prefill: {
        tokens: [
          { type: "player", value: label },
          { type: "status", value: "失去能力" },
        ],
      },
    };
  }
  return fact.recommend || null;
}

export function diffReminders(oldList, newList) {
  const old = oldList || [];
  const next = newList || [];
  const added = next.filter(
    (r) =>
      !old.some(
        (o) => o.role === r.role && o.name === r.name,
      ),
  );
  const removed = old.filter(
    (o) =>
      !next.some(
        (r) => r.role === o.role && r.name === o.name,
      ),
  );
  return { added, removed };
}

export function hasReminder(list, reminder) {
  return (list || []).some(
    (r) => r.role === reminder.role && r.name === reminder.name,
  );
}

export function invertEffect(effect) {
  switch (effect.type) {
    case "setDead":
      return effect.value
        ? { type: "setRevive", playerIndex: effect.playerIndex }
        : { type: "setDead", playerIndex: effect.playerIndex, value: true };
    case "setRevive":
      return { type: "setDead", playerIndex: effect.playerIndex, value: true };
    case "setVoteless":
      return {
        type: "setVoteless",
        playerIndex: effect.playerIndex,
        value: !effect.value,
      };
    case "setAbilityLost":
      return {
        type: "setAbilityLost",
        playerIndex: effect.playerIndex,
        value: !effect.value,
      };
    case "addReminder":
      return {
        type: "removeReminder",
        playerIndex: effect.playerIndex,
        reminder: effect.reminder,
        factType: effect.factType,
      };
    case "removeReminder":
      return {
        type: "addReminder",
        playerIndex: effect.playerIndex,
        reminder: effect.reminder,
        factType: effect.factType,
      };
    default:
      return null;
  }
}
