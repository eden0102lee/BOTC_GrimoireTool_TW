<template>
  <div class="execution-log-card">
    <div class="title">{{ $t("recorder.executionTitle") }}</div>

    <div class="player-row">
      <label class="field-label">{{ $t("recorder.executionPlayer") }}</label>
      <select v-model="selectedLabel" class="player-select">
        <option value="">{{ $t("recorder.pickPlayer") }}</option>
        <option v-for="(p, i) in players" :key="'exec-' + i" :value="label(p, i)">
          {{ label(p, i) }}
        </option>
      </select>
    </div>

    <div class="outcome-row">
      <label class="outcome-option">
        <input type="radio" v-model="died" :value="true" />
        <span>{{ $t("recorder.executionDied") }}</span>
      </label>
      <label class="outcome-option">
        <input type="radio" v-model="died" :value="false" />
        <span>{{ $t("recorder.executionNoDeath") }}</span>
      </label>
    </div>

    <p class="sentence-preview" v-if="previewLine">
      <span class="preview-label">{{ $t("recorder.sentencePreview") }}</span>
      {{ previewLine }}
    </p>
    <p class="alive-preview" v-if="alivePreview">
      {{ alivePreview }}
    </p>

    <div class="actions">
      <button type="button" class="btn clear" @click="onDismiss">
        {{ $t("recorder.dismissManual") }}
      </button>
      <button
        type="button"
        class="btn no-exec"
        @click="recordNoExecution"
      >
        {{ $t("recorder.noExecution") }}
      </button>
      <button
        type="button"
        class="btn write"
        :disabled="!selectedLabel"
        @click="recordExecution"
      >
        {{ $t("recorder.write") }}
      </button>
    </div>
  </div>
</template>

<script>
import { formatPlayerRoleLabel } from "../store/roleInputConfig";
import {
  formatExecutionMessage,
  formatAlivePlayersLine,
  formatNoExecutionMessage,
  resolvePlayerIndex,
} from "../store/battleLogFormat";

export default {
  name: "ExecutionLogCard",
  props: {
    players: { type: Array, required: true },
    defaultNominee: { type: String, default: "" },
  },
  data() {
    return {
      selectedLabel: "",
      died: true,
    };
  },
  computed: {
    previewLine() {
      if (!this.selectedLabel) return "";
      return formatExecutionMessage(this.selectedLabel, this.died);
    },
    alivePreview() {
      return formatAlivePlayersLine(this.players);
    },
  },
  watch: {
    defaultNominee: {
      immediate: true,
      handler(val) {
        if (val && !this.selectedLabel) {
          this.selectedLabel = val;
        }
      },
    },
  },
  methods: {
    label(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    reset() {
      this.selectedLabel = this.defaultNominee || "";
      this.died = true;
    },
    onDismiss() {
      this.reset();
      this.$emit("dismiss");
    },
    recordExecution() {
      if (!this.selectedLabel) return;
      const playerIndex = resolvePlayerIndex(this.players, this.selectedLabel);
      this.$emit("record", {
        type: "execution",
        playerLabel: this.selectedLabel,
        playerIndex,
        died: this.died,
        message: formatExecutionMessage(this.selectedLabel, this.died),
        aliveMessage: formatAlivePlayersLine(this.players),
      });
      this.reset();
    },
    recordNoExecution() {
      this.$emit("record", {
        type: "noExecution",
        message: formatNoExecutionMessage(),
        aliveMessage: formatAlivePlayersLine(this.players),
      });
      this.reset();
    },
  },
};
</script>

<style scoped lang="scss">
.execution-log-card {
  background: rgba(60, 30, 10, 0.55);
  border: 1px dashed rgba(255, 160, 80, 0.55);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  text-align: left;
}

.title {
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  color: #ffb366;
}

.field-label {
  display: block;
  font-size: 0.65rem;
  opacity: 0.7;
  margin-bottom: 4px;
}

.player-select {
  width: 100%;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 160, 80, 0.4);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.72rem;
  margin-bottom: 8px;
}

.outcome-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.outcome-option {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.sentence-preview,
.alive-preview {
  font-size: 0.75rem;
  margin: 0 0 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  word-break: break-word;
  line-height: 1.4;
}

.alive-preview {
  opacity: 0.75;
  font-size: 0.7rem;
}

.preview-label {
  display: block;
  font-size: 0.65rem;
  opacity: 0.65;
  margin-bottom: 2px;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn {
  flex: 1 1 auto;
  min-width: 70px;
  padding: 5px 8px;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &.write {
    border: 1px solid rgba(255, 160, 80, 0.5);
    background: rgba(100, 50, 10, 0.75);
    &:hover:not(:disabled) {
      background: rgba(130, 65, 15, 0.9);
    }
  }
  &.no-exec {
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(50, 50, 50, 0.65);
    &:hover:not(:disabled) {
      background: rgba(70, 70, 70, 0.85);
    }
  }
  &.clear {
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.4);
    &:hover:not(:disabled) {
      background: rgba(60, 60, 60, 0.7);
    }
  }
}
</style>
