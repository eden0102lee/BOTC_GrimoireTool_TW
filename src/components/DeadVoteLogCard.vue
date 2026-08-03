<template>
  <div class="dead-vote-log-card">
    <div class="title">{{ $t("recorder.deadVoteTitle") }}</div>

    <div class="voters-block">
      <div class="voters-label">{{ $t("recorder.deadVotePlayers") }}</div>
      <div class="voter-checks">
        <label
          v-for="(p, i) in players"
          :key="'dv-' + i"
          class="voter-check"
          :class="{ on: playerChecked[i] }"
        >
          <input
            type="checkbox"
            :checked="!!playerChecked[i]"
            @change="togglePlayer(i, $event.target.checked)"
          />
          <span>{{ label(p, i) }}</span>
        </label>
      </div>
    </div>

    <p class="sentence-preview" v-if="sentence">
      <span class="preview-label">{{ $t("recorder.sentencePreview") }}</span>
      {{ sentence }}
    </p>
    <p class="sentence-preview empty" v-else>
      {{ $t("recorder.deadVoteHint") }}
    </p>

    <div class="actions">
      <button type="button" class="btn clear" @click="onDismiss">
        {{ $t("recorder.dismissManual") }}
      </button>
      <button
        type="button"
        class="btn"
        :class="canDelete ? 'delete' : 'write'"
        :disabled="!canDelete && !canWrite"
        @click="onPrimaryAction"
      >
        {{ primaryLabel }}
      </button>
    </div>
  </div>
</template>

<script>
import { formatPlayerRoleLabel } from "../store/roleInputConfig";

export default {
  name: "DeadVoteLogCard",
  props: {
    players: { type: Array, required: true },
    editEntryId: { type: String, default: null },
    initialSnapshot: { type: Object, default: null },
  },
  data() {
    return {
      playerChecked: [],
    };
  },
  computed: {
    editing() {
      return !!this.editEntryId;
    },
    selectedPlayers() {
      return this.players
        .map((p, i) => (this.playerChecked[i] ? this.label(p, i) : null))
        .filter(Boolean);
    },
    sentence() {
      if (!this.selectedPlayers.length) return "";
      return `${this.selectedPlayers.join("、")}使用遺言票`;
    },
    canWrite() {
      return this.selectedPlayers.length > 0;
    },
    canDelete() {
      return this.editing && this.selectedPlayers.length === 0;
    },
    primaryLabel() {
      if (this.canDelete) return this.$t("recorder.deleteRecord");
      if (this.editing) return this.$t("recorder.updateRecord");
      return this.$t("recorder.write");
    },
  },
  watch: {
    players: {
      immediate: true,
      handler(list) {
        const n = (list && list.length) || 0;
        if (this.playerChecked.length !== n) {
          const next = Array(n).fill(false);
          for (let i = 0; i < Math.min(n, this.playerChecked.length); i++) {
            next[i] = !!this.playerChecked[i];
          }
          this.playerChecked = next;
        }
      },
    },
    initialSnapshot: {
      immediate: true,
      handler(snap) {
        if (!snap) return;
        const n = this.players.length;
        const checked = Array(n).fill(false);
        const names = Array.isArray(snap.players) ? snap.players : [];
        for (let i = 0; i < n; i++) {
          const lab = this.label(this.players[i], i);
          checked[i] = names.includes(lab) || names.includes(i);
        }
        this.playerChecked = checked;
      },
    },
  },
  methods: {
    label(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    togglePlayer(i, checked) {
      this.$set(this.playerChecked, i, !!checked);
    },
    reset() {
      this.playerChecked = Array(this.players.length).fill(false);
    },
    onDismiss() {
      this.reset();
      this.$emit("dismiss");
    },
    onPrimaryAction() {
      if (this.canDelete) {
        this.$emit("delete", this.editEntryId);
        this.reset();
        return;
      }
      this.write();
    },
    write() {
      if (!this.canWrite) return;
      this.$emit("record", {
        players: this.selectedPlayers.slice(),
        message: this.sentence,
        formSnapshot: {
          players: this.selectedPlayers.slice(),
        },
        editEntryId: this.editEntryId || null,
      });
      this.reset();
    },
  },
};
</script>

<style scoped lang="scss">
.dead-vote-log-card {
  background: rgba(50, 30, 50, 0.55);
  border: 1px dashed rgba(200, 140, 255, 0.55);
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
  color: #d4a8ff;
}

.voters-block {
  margin-bottom: 8px;
}

.voters-label {
  font-size: 0.65rem;
  opacity: 0.7;
  margin-bottom: 4px;
}

.voter-checks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 180px;
  overflow-y: auto;
}

.voter-check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid transparent;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  input {
    flex-shrink: 0;
  }
  &.on {
    border-color: rgba(200, 140, 255, 0.45);
    background: rgba(70, 40, 80, 0.55);
    color: #fff;
  }
}

.sentence-preview {
  font-size: 0.75rem;
  margin: 0 0 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  word-break: break-word;
  line-height: 1.4;
  &.empty {
    opacity: 0.55;
    font-style: italic;
  }
  .preview-label {
    display: block;
    font-size: 0.65rem;
    opacity: 0.65;
    margin-bottom: 2px;
  }
}

.actions {
  display: flex;
  gap: 6px;
}

.btn {
  flex: 1;
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
    border: 1px solid rgba(200, 140, 255, 0.5);
    background: rgba(80, 40, 100, 0.75);
    &:hover:not(:disabled) {
      background: rgba(100, 50, 120, 0.9);
    }
  }
  &.delete {
    border: 1px solid rgba(206, 1, 0, 0.55);
    background: rgba(90, 30, 30, 0.75);
    &:hover:not(:disabled) {
      background: rgba(120, 40, 40, 0.9);
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
