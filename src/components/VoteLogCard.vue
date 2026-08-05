<template>
  <div class="vote-log-card">
    <div class="title">{{ $t("recorder.voteTitle") }}</div>

    <div class="sentence-row">
      <div class="nominator-field">
        <label class="show-dead-toggle">
          <input type="checkbox" v-model="showDeadNominators" />
          <span>{{ $t("recorder.showDeadPlayers") }}</span>
        </label>
        <select v-model="nominator" class="player-select nominator-select">
          <option value="">{{ $t("recorder.pickPlayer") }}</option>
          <option
            v-for="{ p, i } in nominatorPlayerOptions"
            :key="'nom-' + i"
            :value="label(p, i)"
          >
            {{ nominatorOptionLabel(p, i) }}
          </option>
        </select>
      </div>
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

    <p v-if="nominatorInvalid" class="field-hint">
      {{ $t("recorder.nominatorMustBeAlive") }}
    </p>

    <div class="voters-block">
      <div class="voters-label">{{ $t("recorder.voteVoters") }}</div>
      <div class="voter-checks">
        <label
          v-for="(p, i) in players"
          :key="'v-' + i"
          class="voter-check"
          :class="{ on: voterChecked[i], dead: p.isDead }"
        >
          <input
            type="checkbox"
            :checked="!!voterChecked[i]"
            @change="toggleVoter(i, $event.target.checked)"
          />
          <span>{{ label(p, i) }}</span>
        </label>
      </div>
      <div v-if="showDeadVoteHint" class="dead-vote-hint">
        <p v-if="deadVotersWithGhostVote.length" class="dead-vote-hint-line">
          {{
            $t("recorder.deadVoterAutoHint", {
              names: deadVotersWithGhostVote.join("、"),
            })
          }}
        </p>
        <p v-if="deadVotersNoGhostVote.length" class="dead-vote-hint-line muted">
          {{
            $t("recorder.deadVoterUsedHint", {
              names: deadVotersNoGhostVote.join("、"),
            })
          }}
        </p>
      </div>
    </div>

    <p class="sentence-preview" v-if="sentence">
      <span class="preview-label">{{ $t("recorder.sentencePreview") }}</span>
      {{ sentence }}
      <span v-if="scaffoldPreview" class="scaffold-line">{{ scaffoldPreview }}</span>
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
import {
  formatVoteMessage,
  voterSeatNumbers,
  currentScaffoldMessage,
} from "../store/battleLogFormat";

export default {
  name: "VoteLogCard",
  props: {
    players: { type: Array, required: true },
    dayVotes: { type: Array, default: () => [] },
    editEntryId: { type: String, default: null },
    initialSnapshot: { type: Object, default: null },
  },
  data() {
    return {
      nominator: "",
      nominee: "",
      voterChecked: [],
      showDeadNominators: false,
    };
  },
  computed: {
    editing() {
      return !!this.editEntryId;
    },
    nominatorPlayerOptions() {
      const list = this.players.map((p, i) => ({ p, i }));
      if (this.showDeadNominators) return list;
      return list.filter(({ p }) => p && !p.isDead);
    },
    isNominatorAlive() {
      if (!this.nominator) return false;
      const idx = this.players.findIndex(
        (p, i) => this.label(p, i) === this.nominator,
      );
      return idx >= 0 && this.players[idx] && !this.players[idx].isDead;
    },
    nominatorInvalid() {
      return (
        !this.editing && !!this.nominator && !this.isNominatorAlive
      );
    },
    selectedVoters() {
      return this.players
        .map((p, i) => (this.voterChecked[i] ? this.label(p, i) : null))
        .filter(Boolean);
    },
    voteCount() {
      return this.selectedVoters.length;
    },
    deadVotersWithGhostVote() {
      return this.players
        .map((p, i) => {
          if (!this.voterChecked[i] || !p || !p.isDead || p.isVoteless) {
            return null;
          }
          return this.label(p, i);
        })
        .filter(Boolean);
    },
    deadVotersNoGhostVote() {
      return this.players
        .map((p, i) => {
          if (!this.voterChecked[i] || !p || !p.isDead || !p.isVoteless) {
            return null;
          }
          return this.label(p, i);
        })
        .filter(Boolean);
    },
    showDeadVoteHint() {
      return (
        this.deadVotersWithGhostVote.length > 0 ||
        this.deadVotersNoGhostVote.length > 0
      );
    },
    sentence() {
      if (!this.nominator || !this.nominee) return "";
      const seats = voterSeatNumbers(this.players, this.selectedVoters);
      return formatVoteMessage(
        this.nominator,
        this.nominee,
        this.voteCount,
        seats,
      );
    },
    scaffoldPreview() {
      if (!this.nominator || !this.nominee) return "";
      const votes = this.dayVotes
        .filter((v) => v.id !== this.editEntryId)
        .map((v) => ({ nominee: v.nominee, voteCount: v.voteCount }));
      votes.push({ nominee: this.nominee, voteCount: this.voteCount });
      return currentScaffoldMessage(votes, this.players);
    },
    canWrite() {
      if (!this.nominator || !this.nominee) return false;
      if (this.editing) return true;
      return this.isNominatorAlive;
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
        if (this.nominator && !this.isNominatorAlive) {
          this.showDeadNominators = true;
        }
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
    nominatorOptionLabel(p, i) {
      const base = this.label(p, i);
      if (p && p.isDead) {
        return `${base}（${this.$t("recorder.playerDead")}）`;
      }
      return base;
    },
    toggleVoter(i, checked) {
      this.$set(this.voterChecked, i, !!checked);
    },
    reset() {
      this.nominator = "";
      this.nominee = "";
      this.voterChecked = Array(this.players.length).fill(false);
      this.showDeadNominators = false;
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
  align-items: flex-end;
  gap: 4px;
  margin-bottom: 8px;
}

.nominator-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  flex: 0 0 auto;
  width: 140px;
  max-width: 140px;
}

.nominator-field .player-select,
.nominator-select {
  flex: none;
  width: 100%;
  max-width: 140px;
  box-sizing: border-box;
}

.show-dead-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  line-height: 1.2;
  input {
    accent-color: #7adfff;
    flex-shrink: 0;
  }
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

.field-hint {
  margin: 0 0 8px;
  font-size: 0.68rem;
  color: #ffb366;
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
  &.dead {
    opacity: 0.85;
    &.on {
      border-color: rgba(200, 140, 255, 0.55);
      background: rgba(60, 35, 70, 0.55);
    }
  }
}

.dead-vote-hint {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(60, 35, 70, 0.55);
  border: 1px solid rgba(200, 140, 255, 0.45);
  font-size: 0.68rem;
  color: #e8c8ff;
  line-height: 1.4;
}

.dead-vote-hint-line {
  margin: 0;
  & + & {
    margin-top: 4px;
  }
  &.muted {
    opacity: 0.75;
    font-size: 0.65rem;
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
  .scaffold-line {
    display: block;
    margin-top: 4px;
    color: #ffb366;
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
