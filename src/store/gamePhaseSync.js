/**
 * Keeps grimoire.isNight in sync with gamePhase sub-phases.
 * Night sub-phase → isNight true; all day sub-phases → isNight false.
 */
const PHASE_MUTATIONS = new Set([
  "gamePhase/setSubPhase",
  "gamePhase/advanceDay",
  "gamePhase/retreatDay",
  "gamePhase/restore",
  "gamePhase/reset",
]);

const isNightSubPhase = (subPhase) => subPhase === "night";

export default (store) => {
  const sync = () => {
    const { subPhase } = store.state.gamePhase;
    const isNight = isNightSubPhase(subPhase);
    if (store.state.grimoire.isNight !== isNight) {
      store.commit("toggleNight", isNight);
      if (isNight) {
        store.commit("session/setMarkedPlayer", -1);
      }
    }
  };

  sync();

  store.subscribe(({ type }) => {
    if (PHASE_MUTATIONS.has(type)) {
      sync();
    }
  });
};
