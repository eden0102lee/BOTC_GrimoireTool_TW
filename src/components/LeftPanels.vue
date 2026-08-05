<template>
  <div
    v-if="!session.isSpectator"
    class="left-panels"
    :class="{ 'left-panels--collapsed': !expanded }"
    :style="expanded ? { width: panelWidth + 'px', maxWidth: panelWidth + 'px' } : null"
  >
    <button
      v-if="!expanded"
      type="button"
      class="toggle-tab"
      :title="$t('leftPanels.show')"
      @click="setExpanded(true)"
    >
      {{ $t("leftPanels.show") }}
    </button>
    <div v-else class="panel-stack" :style="{ width: panelWidth + 'px' }">
      <header
        class="stack-header"
        :class="{ resizing: isResizing }"
        @mousedown="onResizeStart"
      >
        <span class="stack-title">{{ $t("leftPanels.title") }}</span>
        <button
          type="button"
          class="collapse-btn"
          :title="$t('leftPanels.hide')"
          @click="setExpanded(false)"
          @mousedown.stop
        >
          <font-awesome-icon icon="times-circle" />
        </button>
      </header>
      <PhaseTracker />
      <PhaseRecorderPanel />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import PhaseTracker from "./PhaseTracker";
import PhaseRecorderPanel from "./PhaseRecorderPanel";
import {
  getViewportSize,
  isPortraitLayout,
} from "../store/viewportLayout";

const STORAGE_KEY = "leftPanelsExpanded";
const WIDTH_KEY = "leftPanelsWidth";
const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 260;

function maxPanelWidth() {
  if (typeof window === "undefined") return 520;
  const left = 8;
  const right = 8;
  return Math.min(520, window.innerWidth - left - right);
}

function clampWidth(width) {
  const max = maxPanelWidth();
  return Math.max(MIN_WIDTH, Math.min(max, Math.round(width)));
}

function readInitialExpanded() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored !== "0";
  }
  if (typeof window !== "undefined") {
    const { width, height } = getViewportSize();
    return !isPortraitLayout(width, height);
  }
  return true;
}

function readInitialWidth() {
  const stored = parseInt(localStorage.getItem(WIDTH_KEY), 10);
  if (Number.isFinite(stored)) {
    return clampWidth(stored);
  }
  return clampWidth(DEFAULT_WIDTH);
}

export default {
  components: { PhaseTracker, PhaseRecorderPanel },
  computed: {
    ...mapState(["session"]),
  },
  data() {
    return {
      expanded: readInitialExpanded(),
      panelWidth: readInitialWidth(),
      isResizing: false,
      resizeStartX: 0,
      resizeStartWidth: 0,
    };
  },
  beforeDestroy() {
    this.teardownResizeListeners();
  },
  methods: {
    setExpanded(value) {
      this.expanded = value;
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    },
    onResizeStart(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      this.isResizing = true;
      this.resizeStartX = event.clientX;
      this.resizeStartWidth = this.panelWidth;
      document.addEventListener("mousemove", this.onResizeMove);
      document.addEventListener("mouseup", this.onResizeEnd);
    },
    onResizeMove(event) {
      if (!this.isResizing) return;
      const delta = event.clientX - this.resizeStartX;
      this.panelWidth = clampWidth(this.resizeStartWidth + delta);
    },
    onResizeEnd() {
      if (!this.isResizing) return;
      this.isResizing = false;
      localStorage.setItem(WIDTH_KEY, String(this.panelWidth));
      this.teardownResizeListeners();
    },
    teardownResizeListeners() {
      document.removeEventListener("mousemove", this.onResizeMove);
      document.removeEventListener("mouseup", this.onResizeEnd);
    },
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
  box-sizing: border-box;

  &.left-panels--collapsed {
    width: auto !important;
    max-width: none !important;
    gap: 0;
  }

  > * {
    pointer-events: auto;
    max-width: 100%;
    box-sizing: border-box;
  }
}

.toggle-tab {
  padding: 8px 12px;
  min-height: 44px;
  min-width: 44px;
  border: 2px solid black;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  white-space: nowrap;

  &:hover {
    color: #ff6b6b;
  }
}

.panel-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  box-sizing: border-box;

  > * {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
}

.stack-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid black;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  cursor: ew-resize;
  user-select: none;
  touch-action: none;

  &.resizing {
    cursor: ew-resize;
  }
}

.stack-title {
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.collapse-btn {
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  opacity: 0.85;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
    color: #ff6b6b;
  }
}
</style>
