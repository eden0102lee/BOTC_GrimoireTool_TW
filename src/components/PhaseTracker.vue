<template>
  <div class="phase-tracker">
    <button
      type="button"
      class="phase-arrow retreat-btn"
      :disabled="!canRetreat"
      :title="
        canRetreat
          ? $t('gamePhase.previousPhase')
          : $t('gamePhase.cannotRetreatEarlier')
      "
      @click="retreat"
    >
      <font-awesome-icon icon="chevron-left" />
    </button>
    <span class="phase-label">{{ displayLabel }}</span>
    <button
      type="button"
      class="phase-arrow advance-btn"
      :title="$t('gamePhase.nextPhase')"
      @click="advance"
    >
      <font-awesome-icon icon="chevron-right" />
    </button>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("gamePhase", ["displayLabel", "canRetreat"]),
  },
  methods: {
    advance() {
      this.$store.dispatch("gamePhase/advance");
    },
    retreat() {
      this.$store.dispatch("gamePhase/retreat");
    },
  },
};
</script>

<style scoped lang="scss">
.phase-tracker {
  width: 100%;
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid black;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  padding: 4px 6px;
  font-size: 0.85rem;
  line-height: 1.3;
}

.phase-label {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  flex: 1;
  min-width: 0;
  text-align: center;
  word-break: break-word;
  line-height: 1.25;
  padding: 0 4px;
}

.phase-arrow {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid black;
  border-radius: 8px;
  color: white;
  font-size: 1.15rem;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  transition: color 200ms, background 200ms, opacity 200ms;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.advance-btn {
  background: rgba(0, 49, 173, 0.85);

  &:hover:not(:disabled) {
    color: #46d5ff;
    background: rgba(0, 49, 173, 1);
  }
}

.retreat-btn {
  background: rgba(90, 45, 0, 0.85);

  &:hover:not(:disabled) {
    color: #ffd699;
    background: rgba(120, 60, 0, 1);
  }
}
</style>
