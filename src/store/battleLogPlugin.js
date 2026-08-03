/**
 * Board mutations no longer auto-write the battle log.
 * Recording is done via the phase recorder panel (role / manual cards).
 * Token/reminder placement stays decoupled; a future menu toggle may
 * optionally attach notes when placing reminder tokens.
 */
export default () => {
  // intentionally empty — keep plugin registered for future opt-in hooks
};
