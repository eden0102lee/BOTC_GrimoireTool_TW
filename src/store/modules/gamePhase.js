import { t } from "../../i18n";

/**
 * Fine-grained game phase tracker (ST-only UI).
 *
 * [Q]/[S] and PhaseTracker buttons advance or retreat this cycle; grimoire.isNight
 * is synced automatically (night sub-phase → true, day sub-phases → false).
 *
 * Phase cycle (entry point: 第0夜):
 *   第0夜 → 第1日清晨 → 私聊 → 公聊 → 投票 → 黃昏 → 第1夜 → 第2日清晨 → …
 */

export const PHASE_ORDER = [
  "dawn",
  "day-private",
  "day-public",
  "day-voting",
  "dusk",
  "night",
];

const initialState = () => ({
  dayNumber: 1,
  nightNumber: 0,
  subPhase: "night",
});

const state = initialState;

const isNightSubPhase = (subPhase) => subPhase === "night";

const phaseLabel = (phaseState) => {
  const sub = phaseState.subPhase;
  if (isNightSubPhase(sub)) {
    return t("gamePhase.displayNight", {
      n: phaseState.nightNumber,
      sub: t(`gamePhase.${sub}`),
    });
  }
  return t("gamePhase.displayDay", {
    n: phaseState.dayNumber,
    sub: t(`gamePhase.${sub}`),
  });
};

const phaseDescriptor = (phaseState) => {
  const sub = phaseState.subPhase;
  const type = isNightSubPhase(sub) ? "night" : "day";
  const number = isNightSubPhase(sub)
    ? phaseState.nightNumber
    : phaseState.dayNumber;
  return {
    type,
    number,
    subPhase: sub,
    id: `${type}-${number}-${sub}`,
    label: phaseLabel(phaseState),
  };
};

const getters = {
  subPhase: (state) => state.subPhase,
  dayNumber: (state) => state.dayNumber,
  nightNumber: (state) => state.nightNumber,
  currentPhase: (state) => phaseDescriptor(state),
  displayLabel: (state) => phaseLabel(state),
  nextSubPhase(state) {
    const idx = PHASE_ORDER.indexOf(state.subPhase);
    return PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
  },
  previousSubPhase(state) {
    const idx = PHASE_ORDER.indexOf(state.subPhase);
    return PHASE_ORDER[(idx - 1 + PHASE_ORDER.length) % PHASE_ORDER.length];
  },
  canRetreat(state) {
    return !(state.nightNumber === 0 && state.subPhase === "night");
  },
};

const mutations = {
  restore(state, saved) {
    if (!saved) return;
    state.dayNumber = saved.dayNumber ?? 1;
    state.nightNumber = saved.nightNumber ?? 0;
    state.subPhase = saved.subPhase || "night";
  },
  reset(state) {
    Object.assign(state, initialState());
  },
  setSubPhase(state, subPhase) {
    state.subPhase = subPhase;
    if (subPhase === "night") {
      state.nightNumber = state.dayNumber;
    }
  },
  advanceDay(state) {
    if (state.nightNumber === 0) {
      state.subPhase = "dawn";
    } else {
      state.dayNumber += 1;
      state.subPhase = "dawn";
    }
  },
  retreatDay(state) {
    if (state.dayNumber === 1) {
      state.nightNumber = 0;
      state.subPhase = "night";
    } else {
      state.dayNumber -= 1;
      state.subPhase = "night";
      state.nightNumber = state.dayNumber;
    }
  },
};

const actions = {
  buildSnapshot({ rootState }) {
    const { players, grimoire, session } = rootState;
    return {
      isNight: grimoire.isNight,
      rolesHidden: grimoire.rolesHidden,
      nomination: session.nomination,
      players: players.players.map((p, index) => ({
        index,
        name: p.name,
        isDead: p.isDead,
        isVoteless: p.isVoteless,
        role:
          p.role && (p.role.name || p.role.id)
            ? p.role.name || p.role.id
            : "",
        reminders: (p.reminders || []).map((r) =>
          r && (r.name || r.role?.name || r.id)
            ? r.name || r.role?.name || r.id
            : String(r),
        ),
      })),
      fabled: (players.fabled || []).map((f) => f.name || f.id || ""),
    };
  },
  advance({ state, commit, dispatch, getters, rootGetters }) {
    const oldLabel = rootGetters["gamePhase/displayLabel"];
    const snap = dispatch("buildSnapshot");
    const currentPhase = rootGetters["gamePhase/currentPhase"];

    commit(
      "battleLog/addEntry",
      {
        category: "phase",
        source: "system",
        message: t("gamePhase.transitionEnd", { phase: oldLabel }),
        snapshot: snap,
        phase: currentPhase,
      },
      { root: true },
    );

    const next = getters.nextSubPhase;
    const endedNightId =
      state.subPhase === "night" && next === "dawn"
        ? `night-${state.nightNumber}`
        : null;
    if (state.subPhase === "night" && next === "dawn") {
      commit("advanceDay");
    } else {
      commit("setSubPhase", next);
    }

    const newLabel = rootGetters["gamePhase/displayLabel"];
    commit(
      "battleLog/addEntry",
      {
        category: "phase",
        source: "system",
        message: t("gamePhase.transitionStart", { phase: newLabel }),
        phase: rootGetters["gamePhase/currentPhase"],
      },
      { root: true },
    );

    if (endedNightId) {
      dispatch(
        "battleLog/appendDawnNightDeathReport",
        { nightPhaseId: endedNightId },
        { root: true },
      );
    }
  },
  retreat({ state, commit, dispatch, getters, rootGetters }) {
    if (!getters.canRetreat) return;

    const oldLabel = rootGetters["gamePhase/displayLabel"];
    const snap = dispatch("buildSnapshot");
    const currentPhase = rootGetters["gamePhase/currentPhase"];

    commit(
      "battleLog/addEntry",
      {
        category: "phase",
        source: "system",
        message: t("gamePhase.transitionEnd", { phase: oldLabel }),
        snapshot: snap,
        phase: currentPhase,
      },
      { root: true },
    );

    if (state.subPhase === "dawn") {
      commit("retreatDay");
    } else {
      commit("setSubPhase", getters.previousSubPhase);
    }

    const newLabel = rootGetters["gamePhase/displayLabel"];
    commit(
      "battleLog/addEntry",
      {
        category: "phase",
        source: "system",
        message: t("gamePhase.transitionRetreat", { phase: newLabel }),
        phase: rootGetters["gamePhase/currentPhase"],
      },
      { root: true },
    );
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
