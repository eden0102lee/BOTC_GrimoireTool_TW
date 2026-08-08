import {
  effectsFromManualTokens,
  effectsFromDeadVote,
  effectsFromEntry,
  pendingResolvedByEntry,
  createPendingFact,
  recommendForPending,
  playerLabel,
  resolvePlayerIndex,
  diffReminders,
  reminderFactTypeForAdd,
  reminderFactTypeForRemove,
  hasReminder,
  invertEffect,
  FACT_TYPES,
} from "../battleLogEffects";
import {
  getRule,
  getSetupRule,
  getCardByKey,
  getDayRule,
  effectsFromRule,
  buildSentence,
  inputsFromRule,
} from "../roleInteractionEngine";
import {
  formatAlivePlayersLine,
  formatEntryForDisplay,
  buildNaturalRoleMessage,
  scaffoldEntriesFromVotes,
  eligibleDeadVotersFromLabels,
  formatPlayerLabel,
} from "../battleLogFormat";

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const MANUAL_END_KEY = "__end__";

const state = () => ({
  entries: [],
  /** @type {Record<string, string[]>} phaseId → entry ids in display order */
  phaseOrders: {},
  /** @type {Record<string, string[]>} phaseId → roleCardKeys in card display order */
  roleCardOrders: {},
  filterType: null,
  filterNumber: null,
  filterSubPhase: null,
  gameMeta: {
    gameName: "",
    scriptName: "",
    playerCount: "",
    storyteller: "",
  },
  linkedMode: true,
  hideTimestamp: false,
  pendingFacts: [],
  previewEffects: [],
  applyingFromLog: false,
});

function actorIndexFromRoleCardKey(roleCardKey) {
  if (!roleCardKey) return -1;
  const parts = String(roleCardKey).split("|");
  if (parts.length < 3) return -1;
  const idx = parseInt(parts[parts.length - 2], 10);
  return Number.isFinite(idx) ? idx : -1;
}

function resolveRuleForRoleCard(formSnapshot, overlay, roleCardKey) {
  if (!formSnapshot || !formSnapshot.ruleId) return null;
  if (
    formSnapshot.setup ||
    (roleCardKey && String(roleCardKey).startsWith("setup|"))
  ) {
    return getSetupRule(formSnapshot.ruleId, overlay);
  }
  if (formSnapshot.cardKey) {
    const byKey = getCardByKey(
      formSnapshot.ruleId,
      formSnapshot.cardKey,
      overlay,
    );
    if (byKey) return byKey;
  }
  if (formSnapshot.dayMode) {
    const dayRule = getDayRule(
      formSnapshot.ruleId,
      formSnapshot.dayNumber || 1,
      overlay,
    );
    if (dayRule) return dayRule;
  }
  return getRule(formSnapshot.ruleId, overlay);
}

/** Build dawn report from previous night's setDead effects. */
export function buildNightDeathMessage(entries, nightPhaseId, players) {
  const deadIndices = new Set();
  (entries || []).forEach((entry) => {
    if (!entry.phase || entry.phase.id !== nightPhaseId) return;
    (entry.effects || []).forEach((eff) => {
      if (
        eff.type === "setDead" &&
        eff.value !== false &&
        eff.playerIndex >= 0
      ) {
        deadIndices.add(eff.playerIndex);
      }
    });
  });
  if (!deadIndices.size) return "昨天夜裡無人死亡";
  const labels = [...deadIndices]
    .sort((a, b) => a - b)
    .map((i) => formatPlayerLabel(players[i], i));
  return `昨天夜裡死亡：${labels.join(" ")}`;
}

export function formatLogMessage(entry, options = {}) {
  if (entry.message) {
    return formatEntryForDisplay(entry, options) || entry.message;
  }
  const actor = entry.actor || "";
  const action = entry.action || "";
  const target = entry.target || "";
  if (!actor && !action) return "";
  if (action && target && target !== "無") {
    return `${actor} ${action} ${target}`;
  }
  if (action) {
    return `${actor} ${action}`;
  }
  return actor;
}

export function formatGameHeader(meta) {
  if (!meta) return "";
  const gameName = (meta.gameName || "").trim();
  const scriptName = (meta.scriptName || "").trim();
  const playerCount = String(meta.playerCount || "").trim();
  const storyteller = (meta.storyteller || "").trim();
  if (!gameName && !scriptName && !playerCount && !storyteller) return "";

  let countPart = "";
  if (playerCount) {
    if (/人局$/.test(playerCount)) countPart = playerCount;
    else if (/人$/.test(playerCount)) countPart = `${playerCount}局`;
    else countPart = `${playerCount}人局`;
  }
  const parenBits = [scriptName, countPart].filter(Boolean).join(" ");
  let line = gameName || "未命名對局";
  if (parenBits) line += ` (${parenBits})`;
  if (storyteller) line += ` - 說書人:${storyteller}`;
  return line;
}

/** Resolve header fields: manual gameName/storyteller + auto script/playerCount */
export function resolveGameMeta(state, rootState) {
  const meta = (state && state.gameMeta) || {};
  const edition = rootState && rootState.edition;
  const players =
    rootState && rootState.players && rootState.players.players
      ? rootState.players.players
      : [];
  const scriptName =
    (edition && (edition.name || edition.id)) || meta.scriptName || "";
  const playerCount = players.length
    ? String(players.length)
    : meta.playerCount || "";
  return {
    gameName: meta.gameName || "",
    storyteller: meta.storyteller || "",
    scriptName,
    playerCount,
  };
}

function deadVoteAlreadyRecorded(state, phaseId, playerLabel) {
  return state.entries.some(
    (e) =>
      e.category === "deadVote" &&
      e.phase &&
      e.phase.id === phaseId &&
      Array.isArray(e.formSnapshot && e.formSnapshot.players) &&
      e.formSnapshot.players.includes(playerLabel),
  );
}

function insertAfterVoteBlock(state, voteId) {
  const voteIdx = state.entries.findIndex((e) => e.id === voteId);
  if (voteIdx < 0) return voteId;
  let idx = voteIdx;
  while (idx + 1 < state.entries.length) {
    const next = state.entries[idx + 1];
    const snap = next.formSnapshot || {};
    const linkedToVote =
      snap.afterVoteId === voteId || snap.linkedVoteId === voteId;
    if (
      linkedToVote &&
      (next.category === "voteScaffold" || next.category === "deadVote")
    ) {
      idx += 1;
    } else {
      break;
    }
  }
  return state.entries[idx].id;
}

function autoRecordDeadVotesFromVoters({
  dispatch,
  state,
  rootState,
  phase,
  voters,
  voteEntryId,
}) {
  if (!voteEntryId || !phase || !phase.id) return;
  const players = rootState.players.players;
  const eligible = eligibleDeadVotersFromLabels(players, voters);
  const toRecord = eligible.filter(
    (label) => !deadVoteAlreadyRecorded(state, phase.id, label),
  );
  if (!toRecord.length) return;
  dispatch("recordDeadVoteCard", {
    players: toRecord,
    message: `${toRecord.join("、")}使用遺言票`,
    formSnapshot: { players: toRecord, linkedVoteId: voteEntryId },
    insertAfterEntryId: voteEntryId,
  });
}

function rebuildPhaseScaffolds({ commit, state, rootState, phase }) {
  if (!phase || !phase.id) return;
  const phaseId = phase.id;
  const players = rootState.players.players;

  state.entries
    .filter(
      (e) => e.category === "voteScaffold" && e.phase && e.phase.id === phaseId,
    )
    .map((e) => e.id)
    .forEach((id) => commit("removeEntry", id));

  const votes = state.entries
    .filter(
      (e) =>
        e.category === "vote" &&
        e.source === "vote" &&
        e.phase &&
        e.phase.id === phaseId,
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const cumulative = [];
  const voteRecords = votes.map((vote) => ({
    nominee:
      (vote.formSnapshot && vote.formSnapshot.nominee) ||
      (vote.target !== "無" ? vote.target : ""),
    voteCount:
      vote.formSnapshot && vote.formSnapshot.voteCount != null
        ? vote.formSnapshot.voteCount
        : 0,
  }));

  const timeline = scaffoldEntriesFromVotes(voteRecords, players);

  timeline.forEach(({ result, voteIndex }) => {
    const vote = votes[voteIndex];
    if (!vote) return;

    commit("addEntry", {
      source: "vote",
      category: "voteScaffold",
      message: result.message,
      formSnapshot: {
        nominee: result.nominee,
        empty: result.empty,
        phaseId,
        afterVoteId: vote.id,
      },
      phase,
      timestamp: new Date(new Date(vote.timestamp).getTime() + 1).toISOString(),
      insertAfterEntryId: insertAfterVoteBlock(state, vote.id),
    });
  });
}

function applyEffectToBoard(ctx, effect) {
  const players = ctx.rootState.players.players;
  const player = players[effect.playerIndex];
  if (!player && effect.playerIndex != null) return;

  switch (effect.type) {
    case "setDead":
      ctx.commit(
        "players/update",
        { player, property: "isDead", value: !!effect.value },
        { root: true },
      );
      if (effect.value && player.isMarked) {
        ctx.commit(
          "players/update",
          { player, property: "isMarked", value: false },
          { root: true },
        );
      }
      break;
    case "setRevive":
      ctx.commit(
        "players/update",
        { player, property: "isDead", value: false },
        { root: true },
      );
      ctx.commit(
        "players/update",
        { player, property: "isVoteless", value: false },
        { root: true },
      );
      break;
    case "setVoteless":
      ctx.commit(
        "players/update",
        { player, property: "isVoteless", value: !!effect.value },
        { root: true },
      );
      break;
    case "setAbilityLost":
      ctx.commit(
        "players/update",
        { player, property: "abilityLost", value: !!effect.value },
        { root: true },
      );
      break;
    case "setRole":
      if (effect.role) {
        ctx.commit(
          "players/update",
          { player, property: "role", value: { ...effect.role } },
          { root: true },
        );
        if (player.disguiseRole && player.disguiseRole.id) {
          ctx.commit(
            "players/update",
            { player, property: "disguiseRole", value: {} },
            { root: true },
          );
        }
        if (Object.prototype.hasOwnProperty.call(effect, "alignment")) {
          const next =
            effect.alignment === "good" || effect.alignment === "evil"
              ? effect.alignment
              : null;
          ctx.commit(
            "players/update",
            { player, property: "alignment", value: next },
            { root: true },
          );
        }
      }
      break;
    case "setAlignment":
      if (effect.alignment === "good" || effect.alignment === "evil") {
        ctx.commit(
          "players/update",
          { player, property: "alignment", value: effect.alignment },
          { root: true },
        );
      } else if (effect.alignment == null) {
        ctx.commit(
          "players/update",
          { player, property: "alignment", value: null },
          { root: true },
        );
      }
      break;
    case "setDisguiseRole":
      if (effect.role) {
        ctx.commit(
          "players/update",
          { player, property: "disguiseRole", value: { ...effect.role } },
          { root: true },
        );
      }
      break;
    case "addReminder": {
      const reminder = effect.reminder;
      if (effect.unique && reminder) {
        players.forEach((p, idx) => {
          if (idx === effect.playerIndex) return;
          if (!hasReminder(p.reminders, reminder)) return;
          const value = (p.reminders || []).filter(
            (r) => !(r.role === reminder.role && r.name === reminder.name),
          );
          ctx.commit(
            "players/update",
            { player: p, property: "reminders", value },
            { root: true },
          );
        });
      }
      if (hasReminder(player.reminders, effect.reminder)) return;
      const value = [...(player.reminders || []), effect.reminder];
      ctx.commit(
        "players/update",
        { player, property: "reminders", value },
        { root: true },
      );
      break;
    }
    case "removeReminder": {
      const value = (player.reminders || []).filter(
        (r) =>
          !(r.role === effect.reminder.role && r.name === effect.reminder.name),
      );
      ctx.commit(
        "players/update",
        { player, property: "reminders", value },
        { root: true },
      );
      break;
    }
    default:
      break;
  }
}

function applyEffects(ctx, effects) {
  if (!effects || !effects.length) return;
  ctx.commit("setApplyingFromLog", true);
  effects.forEach((e) => applyEffectToBoard(ctx, e));
  ctx.commit("setApplyingFromLog", false);
}

function undoEffects(ctx, effects) {
  if (!effects || !effects.length) return;
  ctx.commit("setApplyingFromLog", true);
  effects
    .slice()
    .reverse()
    .forEach((e) => {
      const inv = invertEffect(e);
      if (inv) applyEffectToBoard(ctx, inv);
    });
  ctx.commit("setApplyingFromLog", false);
}

const getters = {
  gameHeader(state, _getters, rootState) {
    return formatGameHeader(resolveGameMeta(state, rootState));
  },
  resolvedGameMeta(state, _getters, rootState) {
    return resolveGameMeta(state, rootState);
  },
  linkedMode: (state) => state.linkedMode,
  openPendingFacts: (state) =>
    state.pendingFacts.filter((f) => f.status === "open"),
  pendingForPlayerIndex: (state) => (playerIndex) =>
    state.pendingFacts.filter(
      (f) => f.status === "open" && f.playerIndex === playerIndex,
    ),
  previewForPlayerIndex: (state) => (playerIndex) =>
    state.previewEffects.filter((e) => e.playerIndex === playerIndex),
  filteredEntries(state) {
    return state.entries.filter((entry) => {
      if (state.filterType && entry.phase.type !== state.filterType) {
        return false;
      }
      if (
        state.filterNumber !== null &&
        entry.phase.number !== state.filterNumber
      ) {
        return false;
      }
      if (
        state.filterSubPhase &&
        entry.phase.subPhase !== state.filterSubPhase
      ) {
        return false;
      }
      return true;
    });
  },
  phases(state) {
    const seen = new Map();
    state.entries.forEach((entry) => {
      const key =
        entry.phase.id ||
        `${entry.phase.type}-${entry.phase.number}-${
          entry.phase.subPhase || ""
        }`;
      if (!seen.has(key)) {
        seen.set(key, entry.phase);
      }
    });
    return [...seen.values()];
  },
  recordedCardKeys(state) {
    const keys = new Set();
    state.entries.forEach((entry) => {
      if (entry.roleCardKey) keys.add(entry.roleCardKey);
    });
    return keys;
  },
  entryByRoleCardKey: (state) => (roleCardKey) =>
    state.entries.find((e) => e.roleCardKey === roleCardKey) || null,
};

const mutations = {
  addEntry(state, entry) {
    if (!entry.phase) {
      console.warn("battleLog/addEntry missing phase", entry);
    }
    const normalized = {
      id: entry.id || newId(),
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || "system",
      roleCardKey: entry.roleCardKey || null,
      manualKey: entry.manualKey || null,
      insertBeforeRoleCardKey:
        entry.insertBeforeRoleCardKey === undefined
          ? null
          : entry.insertBeforeRoleCardKey,
      actor: entry.actor || null,
      action: entry.action || null,
      target: entry.target || null,
      detail: entry.detail || null,
      category: entry.category || entry.source || "note",
      message: entry.message || null,
      formSnapshot: entry.formSnapshot || null,
      snapshot: entry.snapshot || null,
      playerIndex: entry.playerIndex,
      playerName: entry.playerName,
      effects: entry.effects || null,
      correlationId: entry.correlationId || null,
      phase: entry.phase
        ? { ...entry.phase }
        : { type: "day", number: 0, label: "" },
    };
    if (!normalized.message) {
      normalized.message = formatLogMessage(normalized);
    }
    if (entry.insertAfterEntryId) {
      const afterId = entry.insertAfterEntryId;
      const idx = state.entries.findIndex((e) => e.id === afterId);
      if (idx >= 0) {
        state.entries.splice(idx + 1, 0, normalized);
        return normalized.id;
      }
    }
    state.entries.push(normalized);
    return normalized.id;
  },
  updateEntry(state, { id, patch }) {
    const idx = state.entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const next = {
      ...state.entries[idx],
      ...patch,
      id: state.entries[idx].id,
      phase: patch.phase ? { ...patch.phase } : state.entries[idx].phase,
      timestamp:
        patch.timestamp !== undefined
          ? patch.timestamp
          : new Date().toISOString(),
    };
    if (!patch.message && (patch.actor || patch.action || patch.target)) {
      next.message = formatLogMessage(next);
    } else if (patch.message != null && String(patch.message).trim()) {
      next.message = patch.message;
    } else if (!next.message) {
      next.message = formatLogMessage(next);
    }
    state.entries.splice(idx, 1, next);
  },
  removeEntry(state, id) {
    const idx = state.entries.findIndex((e) => e.id === id);
    if (idx >= 0) state.entries.splice(idx, 1);
    Object.keys(state.phaseOrders || {}).forEach((phaseId) => {
      const order = state.phaseOrders[phaseId];
      if (!Array.isArray(order)) return;
      const next = order.filter((eid) => eid !== id);
      if (next.length !== order.length) {
        state.phaseOrders = { ...state.phaseOrders, [phaseId]: next };
      }
    });
  },
  removeByRoleCardKey(state, roleCardKey) {
    const removedIds = state.entries
      .filter((e) => e.roleCardKey === roleCardKey)
      .map((e) => e.id);
    state.entries = state.entries.filter((e) => e.roleCardKey !== roleCardKey);
    if (!removedIds.length) return;
    const removed = new Set(removedIds);
    Object.keys(state.phaseOrders || {}).forEach((phaseId) => {
      const order = state.phaseOrders[phaseId];
      if (!Array.isArray(order)) return;
      const next = order.filter((eid) => !removed.has(eid));
      if (next.length !== order.length) {
        state.phaseOrders = { ...state.phaseOrders, [phaseId]: next };
      }
    });
  },
  setFilter(state, { type = null, number = null, subPhase = null } = {}) {
    state.filterType = type;
    state.filterNumber = number;
    state.filterSubPhase = subPhase;
  },
  clearLog(state) {
    state.entries = [];
    state.phaseOrders = {};
    state.roleCardOrders = {};
    state.filterType = null;
    state.filterNumber = null;
    state.filterSubPhase = null;
    state.pendingFacts = [];
    state.previewEffects = [];
  },
  loadEntries(state, entries) {
    state.entries = entries || [];
  },
  loadPhaseOrders(state, phaseOrders) {
    state.phaseOrders =
      phaseOrders && typeof phaseOrders === "object" ? { ...phaseOrders } : {};
  },
  loadRoleCardOrders(state, roleCardOrders) {
    state.roleCardOrders =
      roleCardOrders && typeof roleCardOrders === "object"
        ? { ...roleCardOrders }
        : {};
  },
  setPhaseOrder(state, { phaseId, order }) {
    if (!phaseId) return;
    state.phaseOrders = {
      ...state.phaseOrders,
      [phaseId]: Array.isArray(order) ? order.slice() : [],
    };
  },
  setRoleCardOrder(state, { phaseId, order }) {
    if (!phaseId) return;
    state.roleCardOrders = {
      ...state.roleCardOrders,
      [phaseId]: Array.isArray(order) ? order.slice() : [],
    };
  },
  appendPhaseOrderId(state, { phaseId, entryId }) {
    if (!phaseId || !entryId) return;
    const existing = state.phaseOrders[phaseId];
    if (!Array.isArray(existing)) return;
    if (existing.includes(entryId)) return;
    state.phaseOrders = {
      ...state.phaseOrders,
      [phaseId]: existing.concat(entryId),
    };
  },
  appendRoleCardOrderKey(state, { phaseId, roleCardKey }) {
    if (!phaseId || !roleCardKey) return;
    const existing = state.roleCardOrders[phaseId];
    if (!Array.isArray(existing)) return;
    if (existing.includes(roleCardKey)) return;
    state.roleCardOrders = {
      ...state.roleCardOrders,
      [phaseId]: existing.concat(roleCardKey),
    };
  },
  setGameMeta(state, meta = {}) {
    state.gameMeta = {
      gameName: meta.gameName != null ? meta.gameName : state.gameMeta.gameName,
      scriptName:
        meta.scriptName != null ? meta.scriptName : state.gameMeta.scriptName,
      playerCount:
        meta.playerCount != null
          ? meta.playerCount
          : state.gameMeta.playerCount,
      storyteller:
        meta.storyteller != null
          ? meta.storyteller
          : state.gameMeta.storyteller,
    };
  },
  loadGameMeta(state, meta) {
    if (!meta || typeof meta !== "object") return;
    state.gameMeta = {
      gameName: meta.gameName || "",
      scriptName: meta.scriptName || "",
      playerCount: meta.playerCount || "",
      storyteller: meta.storyteller || "",
    };
  },
  setLinkedMode(state, value) {
    state.linkedMode = !!value;
    if (!state.linkedMode) {
      state.previewEffects = [];
    }
  },
  loadLinkedMode(state, value) {
    state.linkedMode = !!value;
  },
  setHideTimestamp(state, value) {
    state.hideTimestamp = !!value;
  },
  loadHideTimestamp(state, value) {
    state.hideTimestamp = !!value;
  },
  setApplyingFromLog(state, value) {
    state.applyingFromLog = !!value;
  },
  setPreviewEffects(state, effects) {
    state.previewEffects = effects || [];
  },
  upsertPendingFact(state, fact) {
    const idx = state.pendingFacts.findIndex(
      (f) =>
        f.status === "open" &&
        f.playerIndex === fact.playerIndex &&
        f.factType === fact.factType,
    );
    if (idx >= 0) {
      state.pendingFacts.splice(idx, 1, {
        ...state.pendingFacts[idx],
        ...fact,
        id: state.pendingFacts[idx].id,
        status: "open",
      });
    } else {
      state.pendingFacts.push(fact);
    }
  },
  resolvePendingByEntry(state, { entryId, playerIndex, factTypes }) {
    state.pendingFacts.forEach((f, i) => {
      if (f.status !== "open") return;
      if (playerIndex != null && f.playerIndex !== playerIndex) return;
      if (factTypes && !factTypes.has(f.factType)) return;
      state.pendingFacts.splice(i, 1, {
        ...f,
        status: "resolved",
        resolvedByEntryId: entryId,
      });
    });
  },
  resolvePendingForEntry(state, { entryId, entry, effects, players }) {
    state.pendingFacts = state.pendingFacts.map((f) => {
      if (f.status !== "open") return f;
      if (pendingResolvedByEntry(f, entry, effects || [], players || [])) {
        return { ...f, status: "resolved", resolvedByEntryId: entryId };
      }
      return f;
    });
  },
  clearPendingResolvedByEntry(state, entryId) {
    state.pendingFacts = state.pendingFacts.filter(
      (f) => f.resolvedByEntryId !== entryId,
    );
  },
  removePendingForPlayerFact(state, { playerIndex, factType }) {
    state.pendingFacts = state.pendingFacts.filter(
      (f) =>
        !(
          f.status === "open" &&
          f.playerIndex === playerIndex &&
          f.factType === factType
        ),
    );
  },
  removePendingFact(state, id) {
    state.pendingFacts = state.pendingFacts.filter((f) => f.id !== id);
  },
  loadPendingFacts(state, facts) {
    state.pendingFacts = facts || [];
  },
};

const actions = {
  setLinkedMode({ commit }, value) {
    commit("setLinkedMode", value);
  },
  setHideTimestamp({ commit }, value) {
    commit("setHideTimestamp", value);
  },
  appendDawnNightDeathReport(
    { commit, state, rootState, rootGetters },
    { nightPhaseId },
  ) {
    if (!nightPhaseId) return;
    const players = rootState.players.players;
    const message = buildNightDeathMessage(
      state.entries,
      nightPhaseId,
      players,
    );
    const phase = rootGetters["gamePhase/currentPhase"];
    commit("addEntry", {
      category: "nightDeaths",
      source: "system",
      message,
      phase,
    });
  },
  setPreviewEffects({ commit }, effects) {
    commit("setPreviewEffects", effects);
  },
  clearPreviewEffects({ commit }) {
    commit("setPreviewEffects", []);
  },
  dismissPendingFact({ commit }, id) {
    if (!id) return;
    commit("removePendingFact", id);
  },
  resetForNewGame({ commit, dispatch }) {
    commit("clearLog");
    commit("loadGameMeta", {
      gameName: "",
      scriptName: "",
      playerCount: "",
      storyteller: "",
    });
    commit("gamePhase/reset", null, { root: true });
    dispatch("clearPreviewEffects");
  },
  importBattleLog({ commit, dispatch, state }, raw) {
    let data = raw;
    if (typeof raw === "string") {
      data = JSON.parse(raw);
    }
    if (!data || typeof data !== "object") {
      throw new Error("invalid battle log");
    }
    if (!Array.isArray(data.entries)) {
      throw new Error("missing entries");
    }
    commit("clearLog");
    commit("loadEntries", data.entries);
    if (data.phaseOrders) {
      commit("loadPhaseOrders", data.phaseOrders);
    }
    if (data.roleCardOrders) {
      commit("loadRoleCardOrders", data.roleCardOrders);
    }
    if (data.gameMeta) {
      commit("loadGameMeta", data.gameMeta);
    } else {
      commit("loadGameMeta", {
        gameName: "",
        scriptName: "",
        playerCount: "",
        storyteller: "",
      });
    }
    if (data.gamePhase) {
      commit("gamePhase/restore", data.gamePhase, { root: true });
    } else {
      commit("gamePhase/reset", null, { root: true });
    }
    if (data.linkedMode != null) {
      commit("loadLinkedMode", data.linkedMode);
    }
    if (data.hideTimestamp != null) {
      commit("loadHideTimestamp", data.hideTimestamp);
    }
    if (data.pendingFacts) {
      commit("loadPendingFacts", data.pendingFacts);
    }
    commit("setFilter", { type: null, number: null, subPhase: null });
    dispatch("clearPreviewEffects");
    return {
      entryCount: state.entries.length,
      gameHeader: data.gameHeader || null,
    };
  },
  addPendingFromBoard(
    { commit, state, rootState, rootGetters },
    { playerIndex, factType, boardPayload, recommend },
  ) {
    if (!state.linkedMode || state.applyingFromLog) return;
    const players = rootState.players.players;
    const player = players[playerIndex];
    if (!player) return;
    const phaseId = rootGetters["gamePhase/currentPhase"].id;
    const fact = createPendingFact({
      playerIndex,
      playerName: playerLabel(player, playerIndex),
      factType,
      phaseId,
      boardPayload,
      recommend,
    });
    fact.recommend = recommendForPending(fact, players, rootState);
    commit("upsertPendingFact", fact);
  },
  handleBoardUpdate(
    { commit, dispatch, state, rootState },
    { player, property, value, oldValue },
  ) {
    if (!state.linkedMode || state.applyingFromLog) return;
    const players = rootState.players.players;
    const playerIndex = players.indexOf(player);
    if (playerIndex < 0) return;

    if (property === "isDead") {
      if (value === true) {
        dispatch("addPendingFromBoard", {
          playerIndex,
          factType: FACT_TYPES.DEATH,
          boardPayload: { property, value },
        });
      } else if (oldValue === true) {
        dispatch("addPendingFromBoard", {
          playerIndex,
          factType: FACT_TYPES.REVIVE,
          boardPayload: { property, value },
        });
      }
    } else if (property === "isVoteless") {
      if (value === true) {
        dispatch("addPendingFromBoard", {
          playerIndex,
          factType: FACT_TYPES.DEAD_VOTE,
          boardPayload: { property, value },
          recommend: {
            card: "deadVote",
            prefill: {
              players: [playerLabel(player, playerIndex)],
            },
          },
        });
      } else {
        commit("removePendingForPlayerFact", {
          playerIndex,
          factType: FACT_TYPES.DEAD_VOTE,
        });
      }
    } else if (property === "abilityLost" && value === true) {
      dispatch("addPendingFromBoard", {
        playerIndex,
        factType: FACT_TYPES.ABILITY_LOST,
        boardPayload: { property, value },
      });
    } else if (property === "reminders") {
      const oldList = oldValue || player.reminders || [];
      const { added, removed } = diffReminders(oldList, value);
      added.forEach((reminder) => {
        const factType = reminderFactTypeForAdd(reminder);
        if (factType) {
          dispatch("addPendingFromBoard", {
            playerIndex,
            factType,
            boardPayload: { reminder },
          });
        }
      });
      removed.forEach((reminder) => {
        const factType = reminderFactTypeForRemove(reminder);
        if (factType) {
          commit("removePendingForPlayerFact", { playerIndex, factType });
        }
      });
    }
  },
  applyEntryEffects(ctx, { entry, effects }) {
    const isSetup =
      (entry &&
        entry.formSnapshot &&
        entry.formSnapshot.setup) ||
      (entry &&
        entry.roleCardKey &&
        String(entry.roleCardKey).startsWith("setup|"));
    if (!ctx.state.linkedMode && !isSetup) return;
    applyEffects(ctx, effects);
  },
  undoEntryEffects(ctx, { entry, effects }) {
    const isSetup =
      entry &&
      entry.roleCardKey &&
      String(entry.roleCardKey).startsWith("setup|");
    if (!ctx.state.linkedMode && !isSetup) return;
    undoEffects(ctx, effects);
  },
  afterEntryWritten(ctx, { entryId, entry, effects }) {
    if (!ctx.state.linkedMode) return;
    const players = ctx.rootState.players.players;
    ctx.commit("resolvePendingForEntry", {
      entryId,
      entry,
      effects: effects || [],
      players,
    });
  },
  afterEntryRemoved(ctx, { entry }) {
    if (!ctx.state.linkedMode) return;
    ctx.commit("clearPendingResolvedByEntry", entry.id);
  },
  addManualNote(
    { commit, rootState, rootGetters },
    { text, playerIndex = null },
  ) {
    const player =
      playerIndex !== null && playerIndex >= 0
        ? rootState.players.players[playerIndex]
        : null;
    commit("addEntry", {
      category: "note",
      source: "manual",
      actor: "說書人",
      action: "備註",
      target: player ? player.name : "無",
      detail: text,
      message: text,
      playerIndex,
      playerName: player ? player.name : null,
      phase: rootGetters["gamePhase/currentPhase"],
    });
  },
  recordRoleAction(
    { commit, state, rootGetters, dispatch, rootState },
    {
      roleCardKey,
      actor,
      action,
      target,
      detail,
      formSnapshot,
      category = "ability",
      message,
      effects,
      roleId,
      insertBeforeRoleCardKey,
    },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const players = rootState.players.players;
    let resolvedEffects = effects;
    if (!resolvedEffects && formSnapshot && formSnapshot.ruleId) {
      const overlay = rootState.interactionRules
        ? rootState.interactionRules.overlay
        : {};
      const rule = resolveRuleForRoleCard(formSnapshot, overlay, roleCardKey);
      if (rule) {
        const actorIndex = actorIndexFromRoleCardKey(roleCardKey);
        resolvedEffects = effectsFromRule(
          rule,
          formSnapshot.formData || {},
          players,
          formSnapshot.effectToggles || {},
          rootState.roles,
          actorIndex,
          { setupVariant: formSnapshot.setupVariant || null },
        );
      }
    }
    let resolvedMessage = message;
    if (!resolvedMessage && formSnapshot && formSnapshot.ruleId) {
      const overlay = rootState.interactionRules
        ? rootState.interactionRules.overlay
        : {};
      const rule = resolveRuleForRoleCard(formSnapshot, overlay, roleCardKey);
      if (rule) {
        const actorIndex = actorIndexFromRoleCardKey(roleCardKey);
        resolvedMessage = buildNaturalRoleMessage(rule, {
          players,
          actorIndex,
          formData: formSnapshot.formData || {},
          effects: resolvedEffects,
        });
      }
    }
    const correlationId = newId();
    const existing = state.entries.find((e) => e.roleCardKey === roleCardKey);
    const isSetupCard = roleCardKey && String(roleCardKey).startsWith("setup|");
    const applyBoardEffects = state.linkedMode || isSetupCard;
    const fields = {
      source: "roleCard",
      category,
      roleCardKey,
      actor,
      action: action || "選擇",
      target: target || "無",
      detail: detail || null,
      formSnapshot: formSnapshot || null,
      phase: existing && existing.phase ? existing.phase : phase,
      message: resolvedMessage || null,
      effects: resolvedEffects || null,
      roleId: roleId || (formSnapshot && formSnapshot.ruleId) || null,
      correlationId: (existing && existing.correlationId) || correlationId,
    };
    if (insertBeforeRoleCardKey !== undefined) {
      fields.insertBeforeRoleCardKey = insertBeforeRoleCardKey;
    } else if (existing && existing.insertBeforeRoleCardKey != null) {
      fields.insertBeforeRoleCardKey = existing.insertBeforeRoleCardKey;
    }

    if (existing) {
      if (applyBoardEffects) {
        const oldEffects = effectsFromEntry(existing, players);
        dispatch("undoEntryEffects", { entry: existing, effects: oldEffects });
      }
      commit("updateEntry", { id: existing.id, patch: fields });
      if (applyBoardEffects) {
        if (resolvedEffects && resolvedEffects.length) {
          dispatch("applyEntryEffects", {
            entry: fields,
            effects: resolvedEffects,
          });
        }
        if (state.linkedMode) {
          dispatch("afterEntryWritten", {
            entryId: existing.id,
            entry: { ...fields, id: existing.id },
            effects: resolvedEffects || [],
          });
        }
      }
    } else {
      commit("addEntry", { ...fields, phase });
      const entryId = state.entries[state.entries.length - 1]?.id;
      if (entryId && phase && phase.id) {
        commit("appendPhaseOrderId", { phaseId: phase.id, entryId });
        if (roleCardKey) {
          commit("appendRoleCardOrderKey", {
            phaseId: phase.id,
            roleCardKey,
          });
        }
      }
      if (applyBoardEffects) {
        if (resolvedEffects && resolvedEffects.length) {
          dispatch("applyEntryEffects", {
            entry: fields,
            effects: resolvedEffects,
          });
        }
        if (state.linkedMode) {
          dispatch("afterEntryWritten", {
            entryId,
            entry: { ...fields, id: entryId },
            effects: resolvedEffects || [],
          });
        }
      }
    }
  },
  movePhaseEntry(
    { commit, state },
    { phaseId, entryId, direction, fallbackOrder },
  ) {
    if (!phaseId || !entryId) return;
    const stored = state.phaseOrders[phaseId];
    const base =
      Array.isArray(stored) && stored.length
        ? stored.slice()
        : Array.isArray(fallbackOrder)
        ? fallbackOrder.slice()
        : state.entries
            .filter((e) => e.phase && e.phase.id === phaseId)
            .map((e) => e.id);
    const idx = base.indexOf(entryId);
    if (idx < 0) return;
    const targetIdx = direction < 0 ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= base.length) return;
    const next = base.slice();
    const tmp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = tmp;
    commit("setPhaseOrder", { phaseId, order: next });

    // Keep insertBefore anchors in sync for manuals / optional role cards
    // so 階段紀錄 cards follow the same order as 戰報總覽.
    next.forEach((id, i) => {
      const e = state.entries.find((x) => x.id === id);
      if (!e) return;
      const isManual = e.source === "manual" && e.category === "manual";
      const isOptionalRole =
        e.source === "roleCard" && e.insertBeforeRoleCardKey != null;
      if (!isManual && !isOptionalRole) return;
      let insertBefore = MANUAL_END_KEY;
      for (let j = i + 1; j < next.length; j++) {
        const later = state.entries.find((x) => x.id === next[j]);
        if (
          later &&
          later.source === "roleCard" &&
          later.roleCardKey &&
          later.insertBeforeRoleCardKey == null
        ) {
          insertBefore = later.roleCardKey;
          break;
        }
      }
      if (e.insertBeforeRoleCardKey !== insertBefore) {
        commit("updateEntry", {
          id: e.id,
          patch: {
            insertBeforeRoleCardKey: insertBefore,
            timestamp: e.timestamp,
            message: e.message,
          },
        });
      }
    });
  },
  /**
   * Reorder role cards within a phase by roleCardKey list, and sync phaseOrders
   * for recorded role-card entries to the same relative order.
   */
  reorderRoleCards({ commit, state }, { phaseId, order, fallbackEntryOrder }) {
    if (!phaseId || !Array.isArray(order) || !order.length) return;
    commit("setRoleCardOrder", { phaseId, order });

    const keyToEntryId = new Map();
    state.entries.forEach((e) => {
      if (
        e &&
        e.phase &&
        e.phase.id === phaseId &&
        e.source === "roleCard" &&
        e.roleCardKey
      ) {
        keyToEntryId.set(e.roleCardKey, e.id);
      }
    });
    const roleEntryIds = order
      .map((key) => keyToEntryId.get(key))
      .filter(Boolean);
    if (!roleEntryIds.length) return;

    const stored = state.phaseOrders[phaseId];
    const base =
      Array.isArray(stored) && stored.length
        ? stored.slice()
        : Array.isArray(fallbackEntryOrder)
        ? fallbackEntryOrder.slice()
        : state.entries
            .filter((e) => e.phase && e.phase.id === phaseId)
            .map((e) => e.id);

    const roleIdSet = new Set(roleEntryIds);
    const nonRole = base.filter((id) => !roleIdSet.has(id));
    // Place role entries in new card order; keep non-role entries at end
    // (manuals already interleaved via insertBefore when nightRows renders).
    const next = roleEntryIds.concat(
      nonRole.filter((id) => !roleEntryIds.includes(id)),
    );
    // Better: preserve relative positions of non-role by replacing role slots
    const merged = [];
    let rolePtr = 0;
    base.forEach((id) => {
      if (roleIdSet.has(id)) {
        if (rolePtr < roleEntryIds.length) {
          merged.push(roleEntryIds[rolePtr++]);
        }
      } else {
        merged.push(id);
      }
    });
    while (rolePtr < roleEntryIds.length) {
      merged.push(roleEntryIds[rolePtr++]);
    }
    // Deduplicate while preserving order
    const seen = new Set();
    const deduped = [];
    merged.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      deduped.push(id);
    });
    commit("setPhaseOrder", {
      phaseId,
      order: deduped.length ? deduped : next,
    });
  },
  recordManualCard(
    { commit, state, rootGetters, dispatch, rootState },
    {
      actor,
      action,
      target,
      detail,
      status,
      message,
      insertBeforeRoleCardKey,
      formSnapshot,
      editEntryId,
    },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const players = rootState.players.players;
    const tokens =
      formSnapshot && formSnapshot.tokens ? formSnapshot.tokens : [];
    const effects = effectsFromManualTokens(tokens, players);
    const correlationId = newId();

    if (editEntryId) {
      const old = state.entries.find((e) => e.id === editEntryId);
      const fields = {
        source: "manual",
        category: "manual",
        actor: actor || "說書人",
        action: action || (message ? "備註" : "行動"),
        target: target || "無",
        detail: detail || null,
        message: message || null,
        formSnapshot: formSnapshot || null,
        effects,
        correlationId: (old && old.correlationId) || correlationId,
        phase: old && old.phase ? old.phase : phase,
      };
      if (old && state.linkedMode) {
        const oldEffects = effectsFromEntry(old, players);
        dispatch("undoEntryEffects", { effects: oldEffects });
      }
      commit("updateEntry", { id: editEntryId, patch: fields });
      if (state.linkedMode) {
        if (effects.length) {
          dispatch("applyEntryEffects", { entry: fields, effects });
        }
        dispatch("afterEntryWritten", {
          entryId: editEntryId,
          entry: { ...fields, id: editEntryId },
          effects,
        });
      }
      return;
    }

    const fields = {
      source: "manual",
      category: "manual",
      actor: actor || "說書人",
      action: action || (message ? "備註" : "行動"),
      target: target || "無",
      detail: detail || null,
      message: message || null,
      formSnapshot: formSnapshot || null,
      effects,
      correlationId,
      phase,
    };

    const manualKey = `manual|${phase.id}|${Date.now().toString(
      36,
    )}${Math.random().toString(36).substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
      insertBeforeRoleCardKey:
        insertBeforeRoleCardKey === undefined ? null : insertBeforeRoleCardKey,
    });
    const entryId = state.entries[state.entries.length - 1]?.id;
    if (entryId && phase && phase.id) {
      commit("appendPhaseOrderId", { phaseId: phase.id, entryId });
    }
    if (state.linkedMode) {
      if (effects.length) {
        dispatch("applyEntryEffects", { entry: fields, effects });
      }
      dispatch("afterEntryWritten", {
        entryId,
        entry: { ...fields, id: entryId },
        effects,
      });
    }

    if (status && (target || actor)) {
      const statusActor =
        target && target !== "無" ? target : actor || "說書人";
      const statusEffects = effectsFromManualTokens(
        [
          { type: "player", value: statusActor },
          { type: "status", value: status },
        ],
        players,
      );
      commit("addEntry", {
        source: "manual",
        category: "status",
        actor: statusActor,
        action: status,
        target: "無",
        detail: null,
        effects: statusEffects,
        correlationId,
        phase,
      });
      const statusEntryId = state.entries[state.entries.length - 1]?.id;
      const statusEntry = {
        source: "manual",
        category: "status",
        actor: statusActor,
        action: status,
        target: "無",
        detail: null,
        effects: statusEffects,
        correlationId,
        phase,
        id: statusEntryId,
        formSnapshot: {
          tokens: [
            { type: "player", value: statusActor },
            { type: "status", value: status },
          ],
        },
      };
      if (state.linkedMode) {
        if (statusEffects.length) {
          dispatch("applyEntryEffects", {
            entry: statusEntry,
            effects: statusEffects,
          });
        }
        dispatch("afterEntryWritten", {
          entryId: statusEntryId,
          entry: statusEntry,
          effects: statusEffects,
        });
      }
    }
  },
  recordVoteCard(
    { commit, state, rootGetters, rootState, dispatch },
    {
      nominator,
      nominee,
      voteCount,
      voters,
      message,
      formSnapshot,
      editEntryId,
    },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const voterList = (formSnapshot && formSnapshot.voters) || voters || [];
    const fields = {
      source: "vote",
      category: "vote",
      actor: nominator || "說書人",
      action: "提名",
      target: nominee || "無",
      detail: null,
      message: message || null,
      formSnapshot: formSnapshot || {
        nominator,
        nominee,
        voteCount,
        voters: voterList,
      },
      phase,
    };
    if (editEntryId) {
      commit("updateEntry", { id: editEntryId, patch: fields });
      autoRecordDeadVotesFromVoters({
        dispatch,
        state,
        rootState,
        phase,
        voters: voterList,
        voteEntryId: editEntryId,
      });
      rebuildPhaseScaffolds({ commit, state, rootState, phase });
      return;
    }
    const manualKey = `vote|${phase.id}|${Date.now().toString(
      36,
    )}${Math.random().toString(36).substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
    });
    const voteEntryId = state.entries[state.entries.length - 1]?.id;
    autoRecordDeadVotesFromVoters({
      dispatch,
      state,
      rootState,
      phase,
      voters: voterList,
      voteEntryId,
    });
    rebuildPhaseScaffolds({ commit, state, rootState, phase });
  },
  recordExecution(
    { commit, state, rootGetters, dispatch, rootState },
    { playerLabel, playerIndex, died, message, aliveMessage },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const players = rootState.players.players;
    const effects =
      died && playerIndex != null && playerIndex >= 0
        ? [{ type: "setDead", playerIndex, value: true }]
        : [];
    const correlationId = newId();
    const fields = {
      source: "execution",
      category: "execution",
      actor: playerLabel || "說書人",
      action: died ? "被處決 死亡" : "被處決 沒有死亡",
      target: "無",
      message: message || null,
      playerIndex,
      playerName: playerLabel || null,
      effects,
      correlationId,
      phase,
    };
    commit("addEntry", fields);
    const entryId = state.entries[state.entries.length - 1]?.id;
    if (state.linkedMode) {
      if (effects.length) {
        dispatch("applyEntryEffects", { entry: fields, effects });
      }
      dispatch("afterEntryWritten", {
        entryId,
        entry: { ...fields, id: entryId },
        effects,
      });
    }
    commit("addEntry", {
      source: "system",
      category: "alivePlayers",
      message: aliveMessage || formatAlivePlayersLine(players),
      phase,
      correlationId,
    });
  },
  recordNoExecution(
    { commit, rootGetters, rootState },
    { message, aliveMessage },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const players = rootState.players.players;
    const correlationId = newId();
    commit("addEntry", {
      source: "execution",
      category: "noExecution",
      actor: "說書人",
      action: "無人處決",
      target: "無",
      message: message || "無人處決",
      correlationId,
      phase,
    });
    commit("addEntry", {
      source: "system",
      category: "alivePlayers",
      message: aliveMessage || formatAlivePlayersLine(players),
      phase,
      correlationId,
    });
  },
  recordDeadVoteCard(
    { commit, state, rootGetters, dispatch, rootState },
    {
      players: selectedPlayers,
      message,
      formSnapshot,
      editEntryId,
      insertAfterEntryId,
    },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const players = rootState.players.players;
    const names = Array.isArray(selectedPlayers) ? selectedPlayers : [];
    const effects = effectsFromDeadVote(players, names);
    const correlationId = newId();
    const fields = {
      source: "deadVote",
      category: "deadVote",
      actor: names[0] || "說書人",
      action: "使用遺言票",
      target: names.slice(1).join("、") || "無",
      detail: null,
      message: message || null,
      formSnapshot: formSnapshot || { players: names },
      effects,
      correlationId,
      phase,
    };
    if (editEntryId) {
      const old = state.entries.find((e) => e.id === editEntryId);
      if (old && state.linkedMode) {
        dispatch("undoEntryEffects", {
          effects: effectsFromEntry(old, players),
        });
      }
      commit("updateEntry", { id: editEntryId, patch: fields });
      if (state.linkedMode) {
        if (effects.length) {
          dispatch("applyEntryEffects", { entry: fields, effects });
        }
        dispatch("afterEntryWritten", {
          entryId: editEntryId,
          entry: { ...fields, id: editEntryId },
          effects,
        });
      }
      return;
    }
    const manualKey = `deadVote|${phase.id}|${Date.now().toString(
      36,
    )}${Math.random().toString(36).substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
      insertAfterEntryId: insertAfterEntryId || null,
    });
    const entryId = state.entries[state.entries.length - 1]?.id;
    if (state.linkedMode) {
      if (effects.length) {
        dispatch("applyEntryEffects", { entry: fields, effects });
      }
      dispatch("afterEntryWritten", {
        entryId,
        entry: { ...fields, id: entryId },
        effects,
      });
    }
  },
  cancelRoleCard({ commit, state, dispatch, rootState }, roleCardKey) {
    const entry = state.entries.find((e) => e.roleCardKey === roleCardKey);
    if (!entry) return;
    const isSetupCard = roleCardKey && String(roleCardKey).startsWith("setup|");
    const shouldUndo = state.linkedMode || isSetupCard;
    if (shouldUndo) {
      const effects = effectsFromEntry(entry, rootState.players.players);
      dispatch("undoEntryEffects", { entry, effects });
      dispatch("afterEntryRemoved", { entry });
    }
    commit("removeEntry", entry.id);
  },
  cancelManualEntry({ commit, state, dispatch, rootState }, entryId) {
    const entry = state.entries.find((e) => e.id === entryId);
    if (entry && state.linkedMode) {
      const effects = effectsFromEntry(entry, rootState.players.players);
      dispatch("undoEntryEffects", { effects });
      dispatch("afterEntryRemoved", { entry });
    }
    const phase = entry && entry.phase;
    const wasVote = entry && entry.category === "vote";
    commit("removeEntry", entryId);
    if (wasVote && phase) {
      rebuildPhaseScaffolds({ commit, state, rootState, phase });
    }
  },
  exportJson({ state, rootState, rootGetters }) {
    const gamePhase = rootGetters["gamePhase/currentPhase"];
    const phaseSections = buildPhaseSections(state.entries, state.phaseOrders);
    const resolved = resolveGameMeta(state, rootState);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        gameMeta: resolved,
        gameHeader: formatGameHeader(resolved),
        edition: rootState.edition.name || rootState.edition.id,
        currentPhase: gamePhase,
        gamePhase: rootState.gamePhase,
        linkedMode: state.linkedMode,
        hideTimestamp: state.hideTimestamp,
        players: rootState.players.players.map((p) => ({
          name: p.name,
          role: p.role.name || p.role.id || "",
          isDead: p.isDead,
        })),
        phaseSections,
        entries: state.entries,
        phaseOrders: state.phaseOrders,
        roleCardOrders: state.roleCardOrders,
        pendingFacts: state.pendingFacts,
      },
      null,
      2,
    );
  },
  exportMarkdown({ state, rootState, rootGetters }) {
    const edition = rootState.edition.name || rootState.edition.id;
    const current = rootGetters["gamePhase/displayLabel"];
    const resolved = resolveGameMeta(state, rootState);
    const gameHeader = formatGameHeader(resolved);
    let md = `# 血染鐘樓 戰報\n\n`;
    if (gameHeader) md += `- ${gameHeader}\n`;
    md += `- 劇本：${edition}\n`;
    md += `- 目前階段：${current}\n`;
    md += `- 匯出時間：${new Date().toISOString()}\n\n`;
    md += `## 玩家\n\n`;
    rootState.players.players.forEach((p, i) => {
      md += `${i + 1}. ${p.name}${
        p.role && p.role.name ? ` — ${p.role.name}` : ""
      }${p.isDead ? "（死亡）" : ""}\n`;
    });

    const sections = buildPhaseSections(state.entries, state.phaseOrders);
    const hideTime = !!state.hideTimestamp;
    md += `\n## 階段戰報\n\n`;
    sections.forEach((section) => {
      md += `### ${section.label}\n\n`;
      section.entries.forEach((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString("zh-TW", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const msg = formatLogMessage(entry) || "";
        const msgLines = String(msg)
          .split("\n")
          .filter((l) => l.length);
        const timePrefix = hideTime ? "" : `**${time}** `;
        if (!msgLines.length) {
          md += hideTime ? `- \n` : `- **${time}**\n`;
        } else {
          md += `- ${timePrefix}${msgLines[0]}\n`;
          msgLines.slice(1).forEach((line) => {
            md += `  ${line}\n`;
          });
        }
        if (entry.detail && entry.detail !== "無備註") {
          md += `  └ ${entry.detail}\n`;
        }
        if (entry.snapshot) {
          md += `  - 快照：${
            entry.snapshot.players.filter((p) => !p.isDead).length
          } 存活 / ${entry.snapshot.players.length} 座位\n`;
        }
      });
      md += `\n`;
    });
    return md;
  },
  exportReplayText({ state, rootState }, payload = {}) {
    const hideNickname = !!(payload && payload.hideNickname);
    const logOpts = { hideNickname };
    const resolved = resolveGameMeta(state, rootState);
    const edition =
      resolved.scriptName ||
      rootState.edition.name ||
      rootState.edition.id ||
      "未命名劇本";
    const gameDate = new Date().toISOString().split("T")[0];
    const gameHeader = formatGameHeader(resolved);
    let header = "";
    if (gameHeader) header += `${gameHeader}\n`;
    header += `劇本名稱：${edition}\n遊戲日期：${gameDate}\n說書人：${
      resolved.storyteller || ""
    }\n對局狀態：中途紀錄\n-----------------------------------\n\n`;

    const sections = buildPhaseSections(state.entries, state.phaseOrders);
    const content = sections
      .map((section) => {
        const events = section.entries
          .map((e) => {
            if (e.category === "phase" && e.snapshot) {
              return `\n【當前玩家狀態】\n${formatSnapshotPlayers(
                e.snapshot,
              )}\n`;
            }
            if (e.category === "phase") {
              return `  ${e.message}`;
            }
            let line = `  ${formatLogMessage(e, logOpts)}`;
            if (e.detail && e.detail !== "無備註" && String(e.detail).trim()) {
              line += `\n    └ ${e.detail}`;
            }
            return line;
          })
          .join("\n");
        return `=== ${section.label} ===\n${events || "  (無紀錄)"}`;
      })
      .join("\n\n");

    const players = rootState.players.players;
    let footer = `\n\n===================================\n\n【最終玩家狀態快照】\n`;
    players.forEach((p, i) => {
      const status = p.isDead ? "☠️ 死亡" : "❤️ 存活";
      const roleDisplay =
        p.role && (p.role.name || p.role.id)
          ? p.role.name || p.role.id
          : "未知";
      footer += `[${i + 1}號] ${status} - (${roleDisplay}) ${p.name || "空"}\n`;
    });

    return header + content + footer;
  },
};

function formatSnapshotPlayers(snapshot) {
  if (!snapshot || !snapshot.players) return "";
  return snapshot.players
    .map((p) => {
      const status = p.isDead ? "☠️ 死亡" : "❤️ 存活";
      return `[${p.index + 1}號] ${status} - (${p.role || "未知"}) ${
        p.name || "空"
      }`;
    })
    .join("\n");
}

function buildPhaseSections(entries, phaseOrders = {}) {
  const sections = [];
  let current = null;
  entries.forEach((entry) => {
    const key = entry.phase.id || entry.phase.label;
    if (!current || current.key !== key) {
      current = { key, label: entry.phase.label, entries: [] };
      sections.push(current);
    }
    current.entries.push(entry);
  });
  sections.forEach((section) => {
    const order = phaseOrders && phaseOrders[section.key];
    if (!Array.isArray(order) || !order.length) return;
    const byId = new Map(section.entries.map((e) => [e.id, e]));
    const ordered = [];
    order.forEach((id) => {
      const e = byId.get(id);
      if (e) {
        ordered.push(e);
        byId.delete(id);
      }
    });
    byId.forEach((e) => ordered.push(e));
    section.entries = ordered;
  });
  return sections;
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
