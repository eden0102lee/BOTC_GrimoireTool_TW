/**
 * When battle log linked mode is on, board mutations create pending facts
 * that must be committed in the battle log.
 */
const TRACKED_PROPERTIES = new Set([
  "isDead",
  "isVoteless",
  "abilityLost",
  "reminders",
]);

const playerSnapshots = new WeakMap();

function snapshotPlayer(player) {
  if (!player) return null;
  return {
    isDead: !!player.isDead,
    isVoteless: !!player.isVoteless,
    abilityLost: !!player.abilityLost,
    reminders: (player.reminders || []).map((r) => ({
      role: r.role,
      name: r.name,
    })),
  };
}

export default (store) => {
  store.subscribe((mutation, state) => {
    if (mutation.type !== "players/update") return;
    const { player, property, value } = mutation.payload || {};
    if (!player || !TRACKED_PROPERTIES.has(property)) return;
    if (!state.battleLog.linkedMode) return;
    if (state.battleLog.applyingFromLog) return;
    if (state.session.isSpectator) return;

    const before = playerSnapshots.get(player);
    const oldValue =
      property === "reminders"
        ? before && before.reminders
        : before && before[property];

    store.dispatch("battleLog/handleBoardUpdate", {
      player,
      property,
      value,
      oldValue,
    });

    playerSnapshots.set(player, snapshotPlayer(player));
  });

  // Seed snapshots when players are set
  store.subscribe((mutation, state) => {
    if (
      mutation.type !== "players/set" &&
      mutation.type !== "players/add" &&
      mutation.type !== "players/update"
    ) {
      return;
    }
    (state.players.players || []).forEach((p) => {
      if (!playerSnapshots.has(p)) {
        playerSnapshots.set(p, snapshotPlayer(p));
      }
    });
  });

  (store.state.players.players || []).forEach((p) => {
    playerSnapshots.set(p, snapshotPlayer(p));
  });
};
