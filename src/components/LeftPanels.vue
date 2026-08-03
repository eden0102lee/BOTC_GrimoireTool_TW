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
  left: 8px;
  top: 8px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  font-size: 0.85rem;
  line-height: 1.3;

  > * {
    pointer-events: auto;
  }
}
</style>
