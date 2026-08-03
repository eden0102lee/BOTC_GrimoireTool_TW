<template>
  <div class="phase-recorder" v-if="!session.isSpectator">
    <div class="game-meta">
      <input
        type="text"
        :value="gameMeta.gameName"
        :placeholder="$t('recorder.gameName')"
        @input="updateMeta('gameName', $event.target.value)"
      />
      <input
        type="text"
        :value="gameMeta.storyteller"
        :placeholder="$t('recorder.storyteller')"
        @input="updateMeta('storyteller', $event.target.value)"
      />
    </div>

    <div class="recorder-header">
      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'phase' }"
          @click="activeTab = 'phase'"
        >
          {{ $t("recorder.tabPhase") }}
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'preview' }"
          @click="activeTab = 'preview'"
        >
          {{ $t("recorder.tabPreview") }}
        </button>
      </div>
      <button
        type="button"
        class="collapse-btn"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? $t("recorder.expand") : $t("recorder.collapse") }}
      </button>
    </div>

    <div v-show="!collapsed" class="recorder-body">
      <template v-if="activeTab === 'preview'">
        <div class="game-header-line">
          {{ gameHeader || $t("recorder.gameHeaderEmpty") }}
        </div>
        <div v-if="!previewSections.length" class="empty-hint">
          {{ $t("recorder.previewEmpty") }}
        </div>
        <div
          v-for="section in previewSections"
          :key="section.key"
          class="preview-section"
        >
          <h4 class="preview-phase">=== {{ section.label }} ===</h4>
          <ul class="preview-list">
            <li v-for="e in section.entries" :key="e.id">
              <span class="preview-time">{{ formatTime(e.timestamp) }}</span>
              <span class="preview-msg">{{ entryMessage(e) }}</span>
              <span
                v-if="e.detail && e.detail !== '無備註'"
                class="preview-detail"
                >└ {{ e.detail }}</span
              >
            </li>
          </ul>
        </div>
      </template>

      <template v-else>
      <p class="phase-hint">{{ displayLabel }}</p>

      <template v-if="isNight">
        <div v-for="row in nightRows" :key="row.key">
          <button
            v-if="row.type === 'manualSlot' && !manualFormOpen"
            type="button"
            class="add-manual-btn"
            @click="openManualForm"
          >
            {{ $t("recorder.addManual") }}
          </button>
          <ManualLogCard
            v-else-if="row.type === 'manualSlot' && manualFormOpen"
            :players="players"
            @record="onManualRecord"
            @dismiss="closeManualForm"
          />
          <div
            v-else-if="row.type === 'manualRecorded' && !isEditingManual(row.entry)"
            class="manual-recorded-card"
          >
            <div class="manual-label">{{ $t("recorder.manualTitle") }}</div>
            <div class="manual-summary">{{ row.entry.message }}</div>
            <span class="manual-detail" v-if="row.entry.detail"
              >└ {{ row.entry.detail }}</span
            >
            <button
              type="button"
              class="btn edit"
              @click="startEditManual(row.entry)"
            >
              {{ $t("recorder.editRecord") }}
            </button>
          </div>
          <ManualLogCard
            v-else-if="row.type === 'manualRecorded' && isEditingManual(row.entry)"
            :players="players"
            :edit-entry-id="row.entry.id"
            :initial-tokens="manualEditTokens(row.entry)"
            @record="onManualRecord"
            @delete="onDeleteManual"
            @dismiss="closeManualEdit"
          />
          <RoleActionCard
            v-else-if="row.type === 'role'"
            :player="row.card.player"
            :player-index="row.card.playerIndex"
            :role-card-key="row.card.roleCardKey"
            :reminder="row.card.reminder"
            :players="players"
            :role-options="scriptRoles"
            :is-recorded="row.card.isRecorded"
            :recorded-entry="row.card.recordedEntry"
            @record="onRoleRecord"
          />
        </div>
        <p v-if="!nightCards.length" class="empty-hint">
          {{ $t("recorder.noNightActions") }}
        </p>
      </template>

      <template v-else>
        <template v-for="entry in phaseDayEntries">
          <div
            v-if="!isEditingEntry(entry)"
            :key="'rec-' + (entry.manualKey || entry.id)"
            class="manual-recorded-card"
            :class="{
              vote: entry.category === 'vote',
              'dead-vote': entry.category === 'deadVote',
            }"
          >
            <div class="manual-label">
              {{
                entry.category === "vote"
                  ? $t("recorder.voteTitle")
                  : entry.category === "deadVote"
                    ? $t("recorder.deadVoteTitle")
                    : $t("recorder.manualTitle")
              }}
            </div>
            <div class="manual-summary">{{ entry.message }}</div>
            <span class="manual-detail" v-if="entry.detail"
              >└ {{ entry.detail }}</span
            >
            <button
              type="button"
              class="btn edit"
              @click="startEditEntry(entry)"
            >
              {{ $t("recorder.editRecord") }}
            </button>
          </div>
          <VoteLogCard
            v-else-if="entry.category === 'vote'"
            :key="'edit-vote-' + (entry.manualKey || entry.id)"
            :players="players"
            :edit-entry-id="entry.id"
            :initial-snapshot="voteEditSnapshot(entry)"
            @record="onVoteRecord"
            @delete="onDeleteManual"
            @dismiss="closeManualEdit"
          />
          <DeadVoteLogCard
            v-else-if="entry.category === 'deadVote'"
            :key="'edit-dead-' + (entry.manualKey || entry.id)"
            :players="players"
            :edit-entry-id="entry.id"
            :initial-snapshot="voteEditSnapshot(entry)"
            @record="onDeadVoteRecord"
            @delete="onDeleteManual"
            @dismiss="closeManualEdit"
          />
          <ManualLogCard
            v-else
            :key="'edit-' + (entry.manualKey || entry.id)"
            :players="players"
            :edit-entry-id="entry.id"
            :initial-tokens="manualEditTokens(entry)"
            @record="onManualRecord"
            @delete="onDeleteManual"
            @dismiss="closeManualEdit"
          />
        </template>
        <button
          v-if="isVoting && !voteFormOpen"
          type="button"
          class="add-manual-btn add-vote-btn"
          @click="openVoteForm"
        >
          {{ $t("recorder.addVote") }}
        </button>
        <VoteLogCard
          v-else-if="isVoting && voteFormOpen"
          :players="players"
          @record="onVoteRecord"
          @dismiss="closeVoteForm"
        />
        <button
          v-if="isVoting && !deadVoteFormOpen"
          type="button"
          class="add-manual-btn add-dead-vote-btn"
          @click="openDeadVoteForm"
        >
          {{ $t("recorder.addDeadVote") }}
        </button>
        <DeadVoteLogCard
          v-else-if="isVoting && deadVoteFormOpen"
          :players="players"
          @record="onDeadVoteRecord"
          @dismiss="closeDeadVoteForm"
        />
        <button
          v-if="!manualFormOpen"
          type="button"
          class="add-manual-btn"
          @click="openManualForm"
        >
          {{ $t("recorder.addManual") }}
        </button>
        <ManualLogCard
          v-else
          :players="players"
          @record="onManualRecord"
          @dismiss="closeManualForm"
        />
        <p class="empty-hint">
          {{ isVoting ? $t("recorder.votePhaseHint") : $t("recorder.dayHint") }}
        </p>
      </template>

      <ul class="mini-timeline" v-if="phaseEntries.length">
        <li v-for="e in phaseEntries" :key="e.id">
          {{ e.message }}
          <span v-if="e.detail" class="detail">└ {{ e.detail }}</span>
        </li>
      </ul>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import RoleActionCard from "./RoleActionCard";
import ManualLogCard from "./ManualLogCard";
import VoteLogCard from "./VoteLogCard";
import DeadVoteLogCard from "./DeadVoteLogCard";
import {
  roleHasNightAction,
  buildRoleCardKey,
} from "../store/roleInputConfig";
import { formatLogMessage } from "../store/modules/battleLog";

const MANUAL_END = "__end__";

export default {
  name: "PhaseRecorderPanel",
  components: { RoleActionCard, ManualLogCard, VoteLogCard, DeadVoteLogCard },
  data() {
    return {
      collapsed: false,
      activeTab: "phase",
      manualFormOpen: false,
      voteFormOpen: false,
      deadVoteFormOpen: false,
      editingManualId: null,
    };
  },
  watch: {
    "currentPhase.id"() {
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.editingManualId = null;
    },
  },
  computed: {
    ...mapState(["session", "roles"]),
    ...mapState("players", ["players"]),
    ...mapState("battleLog", ["entries", "gameMeta"]),
    ...mapGetters("gamePhase", [
      "displayLabel",
      "currentPhase",
      "nightNumber",
      "subPhase",
    ]),
    ...mapGetters("battleLog", ["entryByRoleCardKey", "gameHeader"]),
    previewSections() {
      const byPhase = new Map();
      this.entries.forEach((entry) => {
        if (!entry.phase) return;
        // Skip phase-transition noise; only real events under each phase
        if (entry.category === "phase" || entry.source === "system") return;
        const key = entry.phase.id || entry.phase.label;
        if (!key) return;
        if (!byPhase.has(key)) {
          byPhase.set(key, {
            key,
            label: entry.phase.label || key,
            entries: [],
          });
        }
        byPhase.get(key).entries.push(entry);
      });

      const sections = [...byPhase.values()].filter((s) => s.entries.length);
      sections.forEach((section) => {
        section.entries.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      });
      // Phase order follows the earliest event in each section (game timeline)
      sections.sort((a, b) => {
        const ta = new Date(a.entries[0].timestamp).getTime();
        const tb = new Date(b.entries[0].timestamp).getTime();
        return ta - tb;
      });
      return sections;
    },
    isNight() {
      return this.subPhase === "night";
    },
    isVoting() {
      return this.subPhase === "day-voting";
    },
    isFirstNight() {
      return this.nightNumber === 0;
    },
    scriptRoles() {
      const list = [];
      if (this.roles && typeof this.roles.forEach === "function") {
        this.roles.forEach((r) => {
          if (r && r.id) list.push(r);
        });
      }
      return list;
    },
    nightCards() {
      if (!this.isNight) return [];
      const phaseId = this.currentPhase.id;
      const cards = [];
      this.players.forEach((player, playerIndex) => {
        const role = player.role;
        if (!roleHasNightAction(role, this.isFirstNight)) return;
        const roleCardKey = buildRoleCardKey(phaseId, playerIndex, role.id);
        const recordedEntry = this.entryByRoleCardKey(roleCardKey);
        const reminder = this.isFirstNight
          ? role.firstNightReminder || ""
          : role.otherNightReminder || "";
        const order = this.isFirstNight
          ? role.firstNight || 0
          : role.otherNight || 0;
        cards.push({
          player,
          playerIndex,
          roleCardKey,
          reminder,
          order,
          isRecorded: !!recordedEntry,
          recordedEntry,
        });
      });
      cards.sort((a, b) => a.order - b.order);
      return cards;
    },
    phaseManualEntries() {
      const id = this.currentPhase.id;
      return this.entries.filter(
        (e) =>
          e.phase &&
          e.phase.id === id &&
          e.source === "manual" &&
          e.category === "manual",
      );
    },
    phaseDayEntries() {
      const id = this.currentPhase.id;
      return this.entries.filter(
        (e) =>
          e.phase &&
          e.phase.id === id &&
          ((e.source === "manual" && e.category === "manual") ||
            (e.source === "vote" && e.category === "vote") ||
            (e.source === "deadVote" && e.category === "deadVote")),
      );
    },
    firstUnrecordedIndex() {
      return this.nightCards.findIndex(
        (c) => !c.isRecorded && !c.player.abilityLost,
      );
    },
    insertBeforeRoleCardKey() {
      const idx = this.firstUnrecordedIndex;
      if (idx < 0) return MANUAL_END;
      return this.nightCards[idx].roleCardKey;
    },
    nightRows() {
      const rows = [];
      const manuals = this.phaseManualEntries;
      const used = new Set();
      const pushManualsBefore = (beforeKey) => {
        manuals
          .filter((m) => {
            const key =
              m.insertBeforeRoleCardKey == null
                ? MANUAL_END
                : m.insertBeforeRoleCardKey;
            return key === beforeKey;
          })
          .forEach((m) => {
            rows.push({
              type: "manualRecorded",
              key: m.manualKey || m.id,
              entry: m,
            });
            used.add(m.id);
          });
      };

      const insertAt =
        this.firstUnrecordedIndex < 0
          ? this.nightCards.length
          : this.firstUnrecordedIndex;

      if (!this.nightCards.length) {
        pushManualsBefore(MANUAL_END);
        manuals
          .filter((m) => !used.has(m.id))
          .forEach((m) => {
            rows.push({
              type: "manualRecorded",
              key: m.manualKey || m.id,
              entry: m,
            });
          });
        rows.push({ type: "manualSlot", key: "manual-slot" });
        return rows;
      }

      this.nightCards.forEach((card, idx) => {
        pushManualsBefore(card.roleCardKey);
        if (idx === insertAt) {
          rows.push({ type: "manualSlot", key: "manual-slot" });
        }
        rows.push({ type: "role", key: card.roleCardKey, card });
      });
      pushManualsBefore(MANUAL_END);
      if (insertAt >= this.nightCards.length) {
        rows.push({ type: "manualSlot", key: "manual-slot-end" });
      }
      manuals
        .filter((m) => !used.has(m.id))
        .forEach((m) => {
          rows.push({
            type: "manualRecorded",
            key: m.manualKey || m.id,
            entry: m,
          });
        });
      return rows;
    },
    phaseEntries() {
      const id = this.currentPhase.id;
      return this.entries.filter(
        (e) =>
          e.phase &&
          e.phase.id === id &&
          e.category !== "phase" &&
          (e.source === "roleCard" ||
            e.source === "manual" ||
            e.source === "vote" ||
            e.source === "deadVote"),
      );
    },
  },
  methods: {
    updateMeta(field, value) {
      this.$store.commit("battleLog/setGameMeta", { [field]: value });
    },
    openManualForm() {
      this.editingManualId = null;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.manualFormOpen = true;
    },
    closeManualForm() {
      this.manualFormOpen = false;
    },
    openVoteForm() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.deadVoteFormOpen = false;
      this.voteFormOpen = true;
    },
    closeVoteForm() {
      this.voteFormOpen = false;
    },
    openDeadVoteForm() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = true;
    },
    closeDeadVoteForm() {
      this.deadVoteFormOpen = false;
    },
    isEditingManual(entry) {
      return entry && this.editingManualId === entry.id;
    },
    isEditingEntry(entry) {
      return entry && this.editingManualId === entry.id;
    },
    manualEditTokens(entry) {
      const tokens =
        entry && entry.formSnapshot && entry.formSnapshot.tokens;
      if (Array.isArray(tokens) && tokens.length) return tokens;
      // Fallback: single input token from message
      if (entry && entry.message) {
        return [{ type: "input", value: entry.message }];
      }
      return [];
    },
    voteEditSnapshot(entry) {
      if (entry && entry.formSnapshot) return entry.formSnapshot;
      return null;
    },
    startEditManual(entry) {
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.editingManualId = entry.id;
    },
    startEditEntry(entry) {
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.editingManualId = entry.id;
    },
    closeManualEdit() {
      this.editingManualId = null;
    },
    onRoleRecord(payload) {
      const idx = payload
        ? this.nightCards.findIndex((c) => c.roleCardKey === payload.roleCardKey)
        : -1;
      const card = idx >= 0 ? this.nightCards[idx] : null;
      if (card && card.player && card.player.abilityLost) return;
      this.$store.dispatch("battleLog/recordRoleAction", payload);
    },
    onManualRecord(payload) {
      this.$store.dispatch("battleLog/recordManualCard", {
        ...payload,
        insertBeforeRoleCardKey: payload.editEntryId
          ? undefined
          : this.isNight
            ? this.insertBeforeRoleCardKey
            : MANUAL_END,
      });
      this.manualFormOpen = false;
      this.editingManualId = null;
    },
    onVoteRecord(payload) {
      this.$store.dispatch("battleLog/recordVoteCard", payload);
      this.voteFormOpen = false;
      this.editingManualId = null;
    },
    onDeadVoteRecord(payload) {
      this.$store.dispatch("battleLog/recordDeadVoteCard", payload);
      this.deadVoteFormOpen = false;
      this.editingManualId = null;
    },
    onDeleteManual(entryId) {
      if (!entryId) return;
      this.$store.dispatch("battleLog/cancelManualEntry", entryId);
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
    },
    formatTime(ts) {
      if (!ts) return "";
      return new Date(ts).toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    entryMessage(entry) {
      return formatLogMessage(entry) || entry.message || "";
    },
  },
};
</script>

<style scoped lang="scss">
.phase-recorder {
  min-width: 280px;
  max-width: 340px;
  max-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.65);
  border: 2px solid black;
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  overflow: hidden;
}

.game-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 6px 8px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  input {
    width: 100%;
    min-width: 0;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: 0.7rem;
  }
}

.game-header-line {
  text-align: left;
  font-size: 0.78rem;
  font-weight: bold;
  color: #ffd699;
  margin: 0 0 10px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(80, 55, 0, 0.35);
  border: 1px solid rgba(255, 200, 80, 0.3);
  word-break: break-word;
  line-height: 1.35;
}

.recorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.tab {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.72rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: #fff;
  }
  &.active {
    color: #ffd699;
    border-color: rgba(255, 200, 80, 0.55);
    background: rgba(80, 55, 0, 0.55);
  }
}

.collapse-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.7rem;
  cursor: pointer;
  flex-shrink: 0;
  &:hover {
    color: #46d5ff;
  }
}

.preview-section {
  margin-bottom: 10px;
  text-align: left;
}

.preview-phase {
  margin: 0 0 4px;
  font-size: 0.78rem;
  color: #ffd699;
  border-bottom: 1px solid rgba(255, 200, 80, 0.25);
  padding-bottom: 2px;
}

.preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.72rem;
  li {
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    word-break: break-word;
  }
}

.preview-time {
  display: inline-block;
  min-width: 3.2em;
  opacity: 0.55;
  margin-right: 6px;
  font-size: 0.65rem;
}

.preview-msg {
  line-height: 1.35;
}

.preview-detail {
  display: block;
  opacity: 0.65;
  margin: 2px 0 0 3.4em;
  font-size: 0.68rem;
}

.recorder-body {
  padding: 8px 10px;
  overflow-y: auto;
  flex: 1;
}

.phase-hint {
  text-align: center;
  font-size: 0.8rem;
  margin: 0 0 8px;
  opacity: 0.85;
}

.empty-hint {
  font-size: 0.7rem;
  opacity: 0.55;
  font-style: italic;
  margin: 4px 0 8px;
}

.add-manual-btn {
  width: 100%;
  margin-bottom: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 200, 80, 0.65);
  background: rgba(40, 30, 0, 0.55);
  color: #ffd699;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background: rgba(80, 55, 0, 0.7);
  }
  &.add-vote-btn {
    border-color: rgba(70, 213, 255, 0.65);
    background: rgba(20, 40, 50, 0.55);
    color: #7adfff;
    &:hover {
      background: rgba(30, 70, 90, 0.7);
    }
  }
  &.add-dead-vote-btn {
    border-color: rgba(200, 140, 255, 0.65);
    background: rgba(50, 30, 50, 0.55);
    color: #d4a8ff;
    &:hover {
      background: rgba(70, 40, 80, 0.7);
    }
  }
}

.manual-recorded-card {
  background: rgba(40, 30, 0, 0.45);
  border: 1px solid rgba(255, 200, 80, 0.35);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  text-align: left;
  opacity: 0.55;
  filter: grayscale(0.7);
  &.vote {
    background: rgba(20, 40, 50, 0.45);
    border-color: rgba(70, 213, 255, 0.35);
    .manual-label {
      color: #7adfff;
    }
  }
  &.dead-vote {
    background: rgba(50, 30, 50, 0.45);
    border-color: rgba(200, 140, 255, 0.35);
    .manual-label {
      color: #d4a8ff;
    }
  }
}

.manual-label {
  font-size: 0.65rem;
  color: #ffd699;
  margin-bottom: 4px;
  filter: none;
}

.manual-summary {
  font-size: 0.75rem;
  word-break: break-word;
  margin-bottom: 6px;
}

.manual-detail {
  display: block;
  font-size: 0.7rem;
  opacity: 0.7;
  margin: -2px 0 6px 8px;
}

.btn.edit {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 200, 80, 0.5);
  background: rgba(120, 80, 0, 0.75);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
  filter: none;
  opacity: 1;
  &:hover {
    background: rgba(150, 100, 0, 0.9);
  }
}

.btn.cancel {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(90, 30, 30, 0.7);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
  filter: none;
  opacity: 1;
  &:hover {
    background: rgba(120, 40, 40, 0.9);
  }
}

.mini-timeline {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 6px;
  font-size: 0.7rem;
  text-align: left;
  li {
    padding: 3px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    word-break: break-word;
  }
  .detail {
    display: block;
    opacity: 0.65;
    margin-left: 8px;
  }
}
</style>
