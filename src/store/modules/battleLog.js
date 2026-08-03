const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const state = () => ({
  entries: [],
  filterType: null,
  filterNumber: null,
  filterSubPhase: null,
  gameMeta: {
    gameName: "",
    scriptName: "",
    playerCount: "",
    storyteller: "",
  },
});

export function formatLogMessage(entry) {
  if (entry.message) return entry.message;
  const actor = entry.actor || "";
  const action = entry.action || "";
  const target = entry.target || "";
  if (!actor && !action) return "";
  if (action && target && target !== "無") {
    return `${actor} -> ${action} -> ${target}`;
  }
  if (action) {
    return `${actor} -> ${action}`;
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

const getters = {
  gameHeader(state, _getters, rootState) {
    return formatGameHeader(resolveGameMeta(state, rootState));
  },
  resolvedGameMeta(state, _getters, rootState) {
    return resolveGameMeta(state, rootState);
  },
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
        `${entry.phase.type}-${entry.phase.number}-${entry.phase.subPhase || ""}`;
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
      id: newId(),
      timestamp: new Date().toISOString(),
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
      phase: entry.phase
        ? { ...entry.phase }
        : { type: "day", number: 0, label: "" },
    };
    if (!normalized.message) {
      normalized.message = formatLogMessage(normalized);
    }
    state.entries.push(normalized);
  },
  updateEntry(state, { id, patch }) {
    const idx = state.entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const next = {
      ...state.entries[idx],
      ...patch,
      id: state.entries[idx].id,
      phase: patch.phase
        ? { ...patch.phase }
        : state.entries[idx].phase,
      timestamp: new Date().toISOString(),
    };
    if (!patch.message && (patch.actor || patch.action || patch.target)) {
      next.message = formatLogMessage(next);
    } else if (!next.message) {
      next.message = formatLogMessage(next);
    }
    state.entries.splice(idx, 1, next);
  },
  removeEntry(state, id) {
    const idx = state.entries.findIndex((e) => e.id === id);
    if (idx >= 0) state.entries.splice(idx, 1);
  },
  removeByRoleCardKey(state, roleCardKey) {
    state.entries = state.entries.filter((e) => e.roleCardKey !== roleCardKey);
  },
  setFilter(state, { type = null, number = null, subPhase = null } = {}) {
    state.filterType = type;
    state.filterNumber = number;
    state.filterSubPhase = subPhase;
  },
  clearLog(state) {
    state.entries = [];
    state.filterType = null;
    state.filterNumber = null;
    state.filterSubPhase = null;
  },
  loadEntries(state, entries) {
    state.entries = entries || [];
  },
  setGameMeta(state, meta = {}) {
    state.gameMeta = {
      gameName: meta.gameName != null ? meta.gameName : state.gameMeta.gameName,
      scriptName:
        meta.scriptName != null ? meta.scriptName : state.gameMeta.scriptName,
      playerCount:
        meta.playerCount != null ? meta.playerCount : state.gameMeta.playerCount,
      storyteller:
        meta.storyteller != null ? meta.storyteller : state.gameMeta.storyteller,
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
};

const actions = {
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
    { commit, state, rootGetters },
    {
      roleCardKey,
      actor,
      action,
      target,
      detail,
      formSnapshot,
      category = "ability",
    },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const patch = {
      source: "roleCard",
      category,
      roleCardKey,
      actor,
      action: action || "使用能力",
      target: target || "無",
      detail: detail || null,
      formSnapshot: formSnapshot || null,
      phase,
      message: null,
    };
    const existing = state.entries.find((e) => e.roleCardKey === roleCardKey);
    if (existing) {
      commit("updateEntry", { id: existing.id, patch });
    } else {
      commit("addEntry", patch);
    }
  },
  recordManualCard(
    { commit, rootGetters },
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
    const fields = {
      source: "manual",
      category: "manual",
      actor: actor || "說書人",
      action: action || (message ? "備註" : "行動"),
      target: target || "無",
      detail: detail || null,
      message: message || null,
      formSnapshot: formSnapshot || null,
      phase,
    };
    if (editEntryId) {
      commit("updateEntry", { id: editEntryId, patch: fields });
      return;
    }
    const manualKey = `manual|${phase.id}|${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
      insertBeforeRoleCardKey:
        insertBeforeRoleCardKey === undefined
          ? null
          : insertBeforeRoleCardKey,
    });
    if (status && (target || actor)) {
      const statusActor =
        target && target !== "無" ? target : actor || "說書人";
      commit("addEntry", {
        source: "manual",
        category: "status",
        actor: statusActor,
        action: status,
        target: "無",
        detail: null,
        phase,
      });
    }
  },
  recordVoteCard(
    { commit, rootGetters },
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
        voters: voters || [],
      },
      phase,
    };
    if (editEntryId) {
      commit("updateEntry", { id: editEntryId, patch: fields });
      return;
    }
    const manualKey = `vote|${phase.id}|${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
    });
  },
  recordDeadVoteCard(
    { commit, rootGetters },
    { players, message, formSnapshot, editEntryId },
  ) {
    const phase = rootGetters["gamePhase/currentPhase"];
    const names = Array.isArray(players) ? players : [];
    const fields = {
      source: "deadVote",
      category: "deadVote",
      actor: names[0] || "說書人",
      action: "使用遺言票",
      target: names.slice(1).join("、") || "無",
      detail: null,
      message: message || null,
      formSnapshot: formSnapshot || { players: names },
      phase,
    };
    if (editEntryId) {
      commit("updateEntry", { id: editEntryId, patch: fields });
      return;
    }
    const manualKey = `deadVote|${phase.id}|${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    commit("addEntry", {
      ...fields,
      manualKey,
    });
  },
  cancelRoleCard({ commit }, roleCardKey) {
    commit("removeByRoleCardKey", roleCardKey);
  },
  cancelManualEntry({ commit }, entryId) {
    commit("removeEntry", entryId);
  },
  exportJson({ state, rootState, rootGetters }) {
    const gamePhase = rootGetters["gamePhase/currentPhase"];
    const phaseSections = buildPhaseSections(state.entries);
    const resolved = resolveGameMeta(state, rootState);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        gameMeta: resolved,
        gameHeader: formatGameHeader(resolved),
        edition: rootState.edition.name || rootState.edition.id,
        currentPhase: gamePhase,
        gamePhase: rootState.gamePhase,
        players: rootState.players.players.map((p) => ({
          name: p.name,
          role: p.role.name || p.role.id || "",
          isDead: p.isDead,
        })),
        phaseSections,
        entries: state.entries,
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

    const sections = buildPhaseSections(state.entries);
    md += `\n## 階段戰報\n\n`;
    sections.forEach((section) => {
      md += `### ${section.label}\n\n`;
      section.entries.forEach((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString("zh-TW", {
          hour: "2-digit",
          minute: "2-digit",
        });
        md += `- **${time}** ${formatLogMessage(entry)}\n`;
        if (entry.detail && entry.detail !== "無備註") {
          md += `  - └ ${entry.detail}\n`;
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
  exportReplayText({ state, rootState }) {
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

    const sections = buildPhaseSections(state.entries);
    const content = sections
      .map((section) => {
        const events = section.entries
          .map((e) => {
            if (e.category === "phase" && e.snapshot) {
              return `\n【當前玩家狀態】\n${formatSnapshotPlayers(e.snapshot)}\n`;
            }
            if (e.category === "phase") {
              return `  ${e.message}`;
            }
            let line = `  ${formatLogMessage(e)}`;
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

function buildPhaseSections(entries) {
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
  return sections;
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
