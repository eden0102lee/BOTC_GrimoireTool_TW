<template>
  <div class="phase-tracker">
    <div class="phase-display">
      <span class="phase-label">{{ displayLabel }}</span>
    </div>
    <div class="phase-actions">
      <button
        type="button"
        class="phase-btn retreat-btn"
        :disabled="!canRetreat"
        :title="canRetreat ? '' : $t('gamePhase.cannotRetreatEarlier')"
        @click="retreat"
      >
        {{ $t("gamePhase.previousPhase") }}
      </button>
      <button type="button" class="phase-btn advance-btn" @click="advance">
        {{ $t("gamePhase.nextPhase") }}
      </button>
    </div>
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
  min-width: 200px;
  max-width: 260px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid black;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  padding: 8px 10px;
  font-size: 0.85rem;
  line-height: 1.3;
}

.phase-display {
  margin-bottom: 8px;
}

.phase-label {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  display: block;
  text-align: center;
}

.phase-actions {
  display: flex;
  gap: 6px;
}

.phase-btn {
  flex: 1;
  padding: 6px 8px;
  border: 2px solid black;
  border-radius: 8px;
  color: white;
  font-family: inherit;
  font-size: inherit;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  transition: color 200ms, background 200ms;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.advance-btn {
  background: rgba(0, 49, 173, 0.75);

  &:hover:not(:disabled) {
    color: #46d5ff;
    background: rgba(0, 49, 173, 0.95);
  }
}

.retreat-btn {
  background: rgba(90, 45, 0, 0.75);

  &:hover:not(:disabled) {
    color: #ffd699;
    background: rgba(120, 60, 0, 0.95);
  }
}
</style>
