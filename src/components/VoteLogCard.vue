<template>
  <div class="vote-log-card">
    <div class="title">{{ $t("recorder.voteTitle") }}</div>

    <div class="sentence-row">
      <select v-model="nominator" class="player-select">
        <option value="">{{ $t("recorder.pickPlayer") }}</option>
        <option v-for="(p, i) in players" :key="'nom-' + i" :value="label(p, i)">
          {{ label(p, i) }}
        </option>
      </select>
      <span class="fixed-text">{{ $t("recorder.voteNominate") }}</span>
      <select v-model="nominee" class="player-select">
        <option value="">{{ $t("recorder.pickPlayer") }}</option>
        <option v-for="(p, i) in players" :key="'nee-' + i" :value="label(p, i)">
          {{ label(p, i) }}
        </option>
      </select>
      <span class="fixed-text">{{ $t("recorder.voteGot") }}</span>
      <span class="vote-count">{{ voteCount }}</span>
      <span class="fixed-text">{{ $t("recorder.voteBallots") }}</span>
    </div>

    <div class="voters-block">
      <div class="voters-label">{{ $t("recorder.voteVoters") }}</div>
      <div class="voter-checks">
        <label
          v-for="(p, i) in players"
          :key="'v-' + i"
          class="voter-check"
          :class="{ on: voterChecked[i] }"
        >
          <input
            type="checkbox"
            :checked="!!voterChecked[i]"
            @change="toggleVoter(i, $event.target.checked)"
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
      {{ $t("recorder.voteHint") }}
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
  name: "VoteLogCard",
  props: {
    players: { type: Array, required: true },
    editEntryId: { type: String, default: null },
    initialSnapshot: { type: Object, default: null },
  },
  data() {
    return {
      nominator: "",
      nominee: "",
      voterChecked: [],
    };
  },
  computed: {
    editing() {
      return !!this.editEntryId;
    },
    selectedVoters() {
      return this.players
        .map((p, i) => (this.voterChecked[i] ? this.label(p, i) : null))
        .filter(Boolean);
    },
    voteCount() {
      return this.selectedVoters.length;
    },
    sentence() {
      if (!this.nominator || !this.nominee) return "";
      const voters = this.selectedVoters.join("、");
      return `${this.nominator} 提名 ${this.nominee} 獲得 ${this.voteCount} 票(投票: ${voters})`;
    },
    canWrite() {
      return !!(this.nominator && this.nominee);
    },
    canDelete() {
      return this.editing && !this.nominator && !this.nominee && this.voteCount === 0;
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
        if (this.voterChecked.length !== n) {
          const next = Array(n).fill(false);
          for (let i = 0; i < Math.min(n, this.voterChecked.length); i++) {
            next[i] = !!this.voterChecked[i];
          }
          this.voterChecked = next;
        }
      },
    },
    initialSnapshot: {
      immediate: true,
      handler(snap) {
        if (!snap) return;
        this.nominator = snap.nominator || "";
        this.nominee = snap.nominee || "";
        const n = this.players.length;
        const checked = Array(n).fill(false);
        const voters = Array.isArray(snap.voters) ? snap.voters : [];
        for (let i = 0; i < n; i++) {
          const lab = this.label(this.players[i], i);
          checked[i] = voters.includes(lab) || voters.includes(i);
        }
        this.voterChecked = checked;
      },
    },
  },
  methods: {
    label(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    toggleVoter(i, checked) {
      this.$set(this.voterChecked, i, !!checked);
    },
    reset() {
      this.nominator = "";
      this.nominee = "";
      this.voterChecked = Array(this.players.length).fill(false);
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
        nominator: this.nominator,
        nominee: this.nominee,
        voteCount: this.voteCount,
        voters: this.selectedVoters.slice(),
        message: this.sentence,
        formSnapshot: {
          nominator: this.nominator,
          nominee: this.nominee,
          voters: this.selectedVoters.slice(),
          voteCount: this.voteCount,
        },
        editEntryId: this.editEntryId || null,
      });
      this.reset();
    },
  },
};
</script>

<style scoped lang="scss">
.vote-log-card {
  background: rgba(20, 40, 50, 0.55);
  border: 1px dashed rgba(70, 213, 255, 0.55);
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
  color: #7adfff;
}

.sentence-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.player-select {
  min-width: 0;
  max-width: 140px;
  flex: 1 1 100px;
  padding: 3px 4px;
  border-radius: 4px;
  border: 1px solid rgba(70, 213, 255, 0.4);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.72rem;
}

.fixed-text {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.vote-count {
  display: inline-block;
  min-width: 1.4em;
  text-align: center;
  font-weight: bold;
  color: #7adfff;
  font-size: 0.85rem;
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
    border-color: rgba(70, 213, 255, 0.45);
    background: rgba(30, 70, 90, 0.55);
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
    border: 1px solid rgba(70, 213, 255, 0.5);
    background: rgba(20, 80, 100, 0.75);
    &:hover:not(:disabled) {
      background: rgba(30, 100, 120, 0.9);
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
