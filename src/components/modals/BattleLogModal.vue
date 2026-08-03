<template>
  <Modal
    class="battle-log"
    v-if="modals.battleLog"
    @close="toggleModal('battleLog')"
  >
    <h3>{{ $t("battleLog.title") }}</h3>
    <p class="game-header" v-if="gameHeader">{{ gameHeader }}</p>
    <p class="phase-current">
      {{ $t("battleLog.currentPhase", { phase: displayLabel }) }}
    </p>

    <div class="filters">
      <button
        class="button"
        :class="{ disabled: !battleLog.filterType && !battleLog.filterSubPhase }"
        @click="setFilter()"
      >
        {{ $t("battleLog.all") }}
      </button>
      <button
        class="button townsfolk"
        :class="{ disabled: battleLog.filterType === 'day' }"
        @click="setFilter('day')"
      >
        {{ $t("battleLog.dayOnly") }}
      </button>
      <button
        class="button demon"
        :class="{ disabled: battleLog.filterType === 'night' }"
        @click="setFilter('night')"
      >
        {{ $t("battleLog.nightOnly") }}
      </button>
      <select v-model="filterPhaseId" @change="applyPhaseFilter">
        <option :value="null">{{ $t("battleLog.allPhases") }}</option>
        <option
          v-for="phase in phases"
          :key="phase.id || phase.label"
          :value="phase.id || phase.label"
        >
          {{ phase.label }}
        </option>
      </select>
    </div>

    <div class="manual-note" v-if="!session.isSpectator">
      <input
        v-model="noteText"
        :placeholder="$t('battleLog.notePlaceholder')"
        @keyup.enter="addNote"
      />
      <select v-model="notePlayerIndex">
        <option :value="-1">{{ $t("battleLog.noSeat") }}</option>
        <option v-for="(p, i) in players" :key="i" :value="i">
          {{ p.name || $t("battleLog.seat", { n: i + 1 }) }}
        </option>
      </select>
      <button class="button townsfolk" @click="addNote">
        {{ $t("battleLog.addNote") }}
      </button>
    </div>

    <div class="actions">
      <button class="button" @click="exportJson">
        {{ $t("battleLog.exportJson") }}
      </button>
      <button class="button" @click="exportMarkdown">
        {{ $t("battleLog.exportMarkdown") }}
      </button>
      <button class="button townsfolk" @click="exportReplay">
        {{ $t("battleLog.exportReplay") }}
      </button>
      <button
        class="button demon"
        v-if="!session.isSpectator"
        @click="clearLog"
      >
        {{ $t("battleLog.clear") }}
      </button>
    </div>

    <ul class="timeline">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        :class="entry.phase.type"
      >
        <span class="time">{{ formatTime(entry.timestamp) }}</span>
        <span class="phase">{{ entry.phase.label }}</span>
        <span class="message">{{ entry.message }}</span>
        <span class="detail" v-if="entry.detail && entry.detail !== '無備註'"
          >└ {{ entry.detail }}</span
        >
      </li>
      <li v-if="!filteredEntries.length" class="empty">
        {{ $t("battleLog.empty") }}
      </li>
    </ul>
  </Modal>
</template>

<script>
import { mapMutations, mapState, mapGetters } from "vuex";
import Modal from "./Modal";

export default {
  components: { Modal },
  data() {
    return {
      noteText: "",
      notePlayerIndex: -1,
      filterPhaseId: null,
    };
  },
  computed: {
    ...mapState(["modals", "session"]),
    ...mapState("players", ["players"]),
    ...mapGetters("gamePhase", ["displayLabel"]),
    ...mapGetters("battleLog", ["filteredEntries", "phases", "gameHeader"]),
    battleLog() {
      return this.$store.state.battleLog;
    },
  },
  methods: {
    setFilter(type = null) {
      this.filterPhaseId = null;
      this.$store.commit("battleLog/setFilter", {
        type,
        number: null,
        subPhase: null,
      });
    },
    applyPhaseFilter() {
      if (!this.filterPhaseId) {
        this.setFilter();
        return;
      }
      const phase = this.phases.find(
        (p) => (p.id || p.label) === this.filterPhaseId,
      );
      if (!phase) return;
      this.$store.commit("battleLog/setFilter", {
        type: phase.type,
        number: phase.number,
        subPhase: phase.subPhase || null,
      });
    },
    addNote() {
      if (!this.noteText.trim()) return;
      this.$store.dispatch("battleLog/addManualNote", {
        text: this.noteText.trim(),
        playerIndex: this.notePlayerIndex >= 0 ? this.notePlayerIndex : null,
      });
      this.noteText = "";
    },
    download(filename, content, mime) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    exportJson() {
      Promise.resolve(this.$store.dispatch("battleLog/exportJson")).then(
        (data) => {
          this.download(
            `battle-log-${Date.now()}.json`,
            data,
            "application/json",
          );
        },
      );
    },
    exportMarkdown() {
      Promise.resolve(this.$store.dispatch("battleLog/exportMarkdown")).then(
        (data) => {
          this.download(`battle-log-${Date.now()}.md`, data, "text/markdown");
        },
      );
    },
    exportReplay() {
      Promise.resolve(this.$store.dispatch("battleLog/exportReplayText")).then(
        (data) => {
          this.download(
            `血染覆盤紀錄_${Date.now()}.txt`,
            data,
            "text/plain;charset=utf-8",
          );
        },
      );
    },
    clearLog() {
      if (confirm(this.$t("confirm.clearBattleLog"))) {
        this.$store.commit("battleLog/clearLog");
        this.$store.commit("gamePhase/reset");
        this.filterPhaseId = null;
      }
    },
    formatTime(ts) {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";

h3 {
  margin: 0 40px;
}

.phase-current {
  text-align: center;
  opacity: 0.8;
  margin: 0 0 10px;
}

.game-header {
  text-align: center;
  color: #ffd699;
  font-weight: bold;
  margin: 0 0 6px;
  word-break: break-word;
}

.filters,
.manual-note,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}

.manual-note input {
  flex: 1;
  min-width: 180px;
  padding: 4px 8px;
}

.button {
  cursor: pointer;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  &.townsfolk {
    border-color: $townsfolk;
  }
  &.demon {
    border-color: $demon;
  }
  &.disabled {
    opacity: 0.5;
  }
  &:hover {
    color: red;
  }
}

.timeline {
  max-height: 50vh;
  overflow-y: auto;
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    &.night .phase {
      color: $demon;
    }
    &.day .phase {
      color: $townsfolk;
    }
    &.empty {
      opacity: 0.5;
      font-style: italic;
    }
  }
  .time {
    opacity: 0.6;
    margin-right: 8px;
    font-size: 85%;
  }
  .phase {
    margin-right: 8px;
    font-weight: bold;
  }
  .detail {
    display: block;
    opacity: 0.65;
    margin-left: 1.5em;
    font-size: 90%;
  }
}
</style>
