<template>
  <div class="left-panels">
    <ShortcutPanel />
    <PhaseTracker v-if="!session.isSpectator" />
    <PhaseRecorderPanel v-if="!session.isSpectator" />
  </div>
</template>

<script>
import { mapState } from "vuex";
import ShortcutPanel from "./ShortcutPanel";
import PhaseTracker from "./PhaseTracker";
import PhaseRecorderPanel from "./PhaseRecorderPanel";

export default {
  components: { ShortcutPanel, PhaseTracker, PhaseRecorderPanel },
  computed: {
    ...mapState(["session"]),
  },
};
</script>

<style scoped lang="scss">
.left-panels {
  position: fixed;
  left: max(8px, env(safe-area-inset-left, 0px));
  top: max(8px, env(safe-area-inset-top, 0px));
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  font-size: 0.85rem;
  line-height: 1.3;
  max-width: min(
    340px,
    calc(100vw - max(16px, env(safe-area-inset-left, 0px)) - max(8px, env(safe-area-inset-right, 0px)))
  );

  > * {
    pointer-events: auto;
    max-width: 100%;
  }
}
</style>
