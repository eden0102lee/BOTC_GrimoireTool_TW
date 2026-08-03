<template>
  <div class="phase-tracker" :class="{ collapsed: !expanded }">
    <button
      v-if="!expanded"
      type="button"
      class="toggle-tab"
      :title="$t('gamePhase.showTracker')"
      @click="setExpanded(true)"
    >
      <span class="toggle-label">{{ displayLabel }}</span>
    </button>
    <template v-else>
      <header class="tracker-header">
        <span class="phase-label">{{ displayLabel }}</span>
        <button
          type="button"
          class="collapse-btn"
          :title="$t('gamePhase.hideTracker')"
          @click="setExpanded(false)"
        >
          <font-awesome-icon icon="times" />
        </button>
      </header>
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
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

const STORAGE_KEY = "phaseTrackerExpanded";
const MOBILE_MQ = "(max-width: 767.98px)";

function readInitialExpanded() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored !== "0";
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return !window.matchMedia(MOBILE_MQ).matches;
  }
  return true;
}

export default {
  data() {
    return {
      expanded: readInitialExpanded(),
    };
  },
  computed: {
    ...mapGetters("gamePhase", ["displayLabel", "canRetreat"]),
  },
  methods: {
    setExpanded(value) {
      this.expanded = value;
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    },
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
  width: min(
    260px,
    calc(100vw - max(16px, env(safe-area-inset-left, 0px)) - max(8px, env(safe-area-inset-right, 0px)))
  );
  min-width: 0;
  max-width: 260px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid black;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  padding: 8px 10px;
  font-size: 0.85rem;
  line-height: 1.3;

  &.collapsed {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
  }
}

.toggle-tab {
  display: block;
  width: 100%;
  padding: 8px 12px;
  min-height: 44px;
  border: 2px solid black;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  text-align: left;

  &:hover {
    color: #46d5ff;
  }
}

.toggle-label {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}

.phase-label {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  line-height: 1.25;
}

.collapse-btn {
  flex-shrink: 0;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  margin: -8px -8px -8px 0;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  line-height: 1;

  &:hover {
    opacity: 1;
    color: #ff6b6b;
  }
}

.phase-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.phase-btn {
  flex: 1 1 120px;
  min-height: 44px;
  padding: 8px;
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
