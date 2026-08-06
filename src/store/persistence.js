import { t } from "../i18n";

export default (store) => {
  const updatePagetitle = () =>
    (document.title = `${t("pageTitle.base")} — ${t("pageTitle.grimoire")}`);

  const persistBattleLog = (state) => {
    localStorage.setItem(
      "battleLog",
      JSON.stringify({
        entries: state.battleLog.entries,
        gameMeta: state.battleLog.gameMeta,
        gamePhase: state.gamePhase,
        linkedMode: state.battleLog.linkedMode,
        pendingFacts: state.battleLog.pendingFacts,
      }),
    );
  };

  // initialize data
  if (localStorage.getItem("background")) {
    store.commit("setBackground", localStorage.background);
  }
  if (localStorage.getItem("muted")) {
    store.commit("toggleMuted", true);
  }
  if (localStorage.getItem("static")) {
    store.commit("toggleStatic", true);
  }
  if (localStorage.getItem("imageOptIn")) {
    store.commit("toggleImageOptIn", true);
  }
  if (localStorage.getItem("zoom")) {
    store.commit("setZoom", parseFloat(localStorage.getItem("zoom")));
  }
  if (localStorage.getItem("rolesHidden")) {
    store.commit("toggleRolesHidden", true);
  }
  if (
    localStorage.getItem("centerMarkHidden") ||
    localStorage.edition !== undefined ||
    localStorage.roles !== undefined
  ) {
    store.commit("setShowCenterMark", false);
  }
  updatePagetitle();
  if (localStorage.roles !== undefined) {
    store.commit("setCustomRoles", JSON.parse(localStorage.roles));
    store.commit("setEdition", { id: "custom" });
  }
  if (localStorage.edition !== undefined) {
    // this will initialize state.roles for official editions
    store.commit("setEdition", JSON.parse(localStorage.edition));
  }
  if (localStorage.bluffs !== undefined) {
    JSON.parse(localStorage.bluffs).forEach((role, index) => {
      store.commit("players/setBluff", {
        index,
        role: store.state.roles.get(role) || {},
      });
    });
  }
  if (localStorage.fabled !== undefined) {
    store.commit("players/setFabled", {
      fabled: JSON.parse(localStorage.fabled).map(
        (fabled) => store.state.fabled.get(fabled.id) || fabled,
      ),
    });
  }
  if (localStorage.players) {
    store.commit(
      "players/set",
      JSON.parse(localStorage.players).map((player) => ({
        ...player,
        role:
          store.state.roles.get(player.role) ||
          store.getters.rolesJSONbyId.get(player.role) ||
          {},
        disguiseRole:
          (player.disguiseRole &&
            (store.state.roles.get(player.disguiseRole) ||
              store.getters.rolesJSONbyId.get(player.disguiseRole))) ||
          {},
      })),
    );
  }
  /**** Session related data *****/
  if (localStorage.getItem("playerId")) {
    store.commit("session/setPlayerId", localStorage.getItem("playerId"));
  }
  if (localStorage.getItem("session") && !window.location.hash.substr(1)) {
    const [spectator, sessionId] = JSON.parse(localStorage.getItem("session"));
    store.commit("session/setSpectator", spectator);
    store.commit("session/setSessionId", sessionId);
  }
  // Prefer unified battleLog key; fall back to legacy split keys
  if (localStorage.getItem("battleLog")) {
    try {
      const saved = JSON.parse(localStorage.getItem("battleLog"));
      store.commit("battleLog/loadEntries", saved.entries || []);
      if (saved.gameMeta) {
        store.commit("battleLog/loadGameMeta", saved.gameMeta);
      }
      if (saved.gamePhase) {
        store.commit("gamePhase/restore", saved.gamePhase);
      } else {
        store.commit("gamePhase/restore", {
          dayNumber: saved.dayNumber || 1,
          nightNumber: saved.nightNumber ?? 0,
          subPhase: "night",
        });
      }
      if (saved.linkedMode != null) {
        store.commit("battleLog/loadLinkedMode", saved.linkedMode);
      }
      if (saved.pendingFacts) {
        store.commit("battleLog/loadPendingFacts", saved.pendingFacts);
      }
    } catch (e) {
      console.warn("could not restore battle log", e);
    }
  } else {
    if (localStorage.battleLogEntries) {
      store.commit(
        "battleLog/loadEntries",
        JSON.parse(localStorage.battleLogEntries),
      );
    }
    if (localStorage.battleLogPhase) {
      const legacy = JSON.parse(localStorage.battleLogPhase);
      store.commit("gamePhase/restore", {
        dayNumber: legacy.dayNumber || 1,
        nightNumber: legacy.nightNumber ?? 0,
        subPhase: "night",
      });
    }
  }

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "session/setSpectator":
        break;
      case "setBackground":
        if (payload) {
          localStorage.setItem("background", payload);
        } else {
          localStorage.removeItem("background");
        }
        break;
      case "toggleMuted":
        if (state.grimoire.isMuted) {
          localStorage.setItem("muted", 1);
        } else {
          localStorage.removeItem("muted");
        }
        break;
      case "toggleStatic":
        if (state.grimoire.isStatic) {
          localStorage.setItem("static", 1);
        } else {
          localStorage.removeItem("static");
        }
        break;
      case "toggleImageOptIn":
        if (state.grimoire.isImageOptIn) {
          localStorage.setItem("imageOptIn", 1);
        } else {
          localStorage.removeItem("imageOptIn");
        }
        break;
      case "setZoom":
        if (payload !== 0) {
          localStorage.setItem("zoom", payload);
        } else {
          localStorage.removeItem("zoom");
        }
        break;
      case "toggleRolesHidden":
        if (state.grimoire.rolesHidden) {
          localStorage.setItem("rolesHidden", 1);
        } else {
          localStorage.removeItem("rolesHidden");
        }
        break;
      case "setEdition":
        localStorage.setItem("edition", JSON.stringify(payload));
        localStorage.setItem("centerMarkHidden", "1");
        if (state.edition.isOfficial) {
          localStorage.removeItem("roles");
        }
        break;
      case "setCustomRoles":
        if (!payload.length) {
          localStorage.removeItem("roles");
        } else {
          localStorage.setItem("roles", JSON.stringify(payload));
        }
        break;
      case "players/setBluff":
        localStorage.setItem(
          "bluffs",
          JSON.stringify(state.players.bluffs.map(({ id }) => id)),
        );
        break;
      case "players/setFabled":
        localStorage.setItem(
          "fabled",
          JSON.stringify(
            state.players.fabled.map((fabled) =>
              fabled.isCustom ? fabled : { id: fabled.id },
            ),
          ),
        );
        break;
      case "players/add":
      case "players/update":
      case "players/remove":
      case "players/clear":
      case "players/set":
      case "players/swap":
      case "players/move":
        if (state.players.players.length) {
          localStorage.setItem(
            "players",
            JSON.stringify(
              state.players.players.map((player) => ({
                ...player,
                // simplify the stored data
                role: player.role.id || {},
                disguiseRole:
                  (player.disguiseRole && player.disguiseRole.id) || {},
              })),
            ),
          );
        } else {
          localStorage.removeItem("players");
        }
        break;
      case "session/setSessionId":
        if (payload) {
          localStorage.setItem(
            "session",
            JSON.stringify([state.session.isSpectator, payload]),
          );
        } else {
          localStorage.removeItem("session");
        }
        break;
      case "session/setPlayerId":
        if (payload) {
          localStorage.setItem("playerId", payload);
        } else {
          localStorage.removeItem("playerId");
        }
        break;
      case "battleLog/addEntry":
      case "battleLog/updateEntry":
      case "battleLog/removeEntry":
      case "battleLog/removeByRoleCardKey":
      case "battleLog/clearLog":
      case "battleLog/loadEntries":
      case "battleLog/setGameMeta":
      case "battleLog/loadGameMeta":
      case "battleLog/setLinkedMode":
      case "battleLog/loadLinkedMode":
      case "battleLog/upsertPendingFact":
      case "battleLog/resolvePendingForEntry":
      case "battleLog/resolvePendingByEntry":
      case "battleLog/clearPendingResolvedByEntry":
      case "battleLog/removePendingForPlayerFact":
      case "battleLog/removePendingFact":
      case "battleLog/loadPendingFacts":
      case "gamePhase/restore":
      case "gamePhase/reset":
      case "gamePhase/setSubPhase":
      case "gamePhase/advanceDay":
      case "gamePhase/retreatDay":
        persistBattleLog(state);
        break;
    }
  });
};
