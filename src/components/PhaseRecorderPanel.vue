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

    <div class="linked-mode-row">
      <label class="linked-toggle">
        <input
          type="checkbox"
          :checked="linkedMode"
          @change="toggleLinkedMode($event.target.checked)"
        />
        <span>{{ $t("recorder.linkedMode") }}</span>
      </label>
    </div>

    <div class="new-game-row">
      <span class="new-game-label">{{ $t("recorder.newGame") }}</span>
      <div class="new-game-actions">
        <button
          type="button"
          class="new-game-btn export"
          :title="$t('recorder.exportBattleLog')"
          @click="exportBattleLog"
        >
          {{ $t("recorder.exportBattleLog") }}
        </button>
        <button
          type="button"
          class="new-game-btn import"
          :title="$t('recorder.importBattleLog')"
          @click="pickImportFile"
        >
          {{ $t("recorder.importBattleLog") }}
        </button>
        <input
          ref="importFile"
          type="file"
          accept=".json,application/json"
          hidden
          @change="onImportFile"
        />
        <button
          type="button"
          class="new-game-btn delete"
          :title="$t('recorder.deleteBattleLog')"
          @click="deleteBattleLog"
        >
          {{ $t("recorder.deleteBattleLog") }}
        </button>
      </div>
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
      <div v-if="linkedMode && openPendingFacts.length" class="pending-block">
        <div class="pending-title">
          <font-awesome-icon icon="exclamation-triangle" />
          {{ $t("recorder.pendingTitle", { n: openPendingFacts.length }) }}
        </div>
        <div
          v-for="fact in openPendingFacts"
          :key="fact.id"
          class="pending-row"
          :class="{ recommended: isRecommended(fact) }"
        >
          <span class="pending-label">{{ pendingLabel(fact) }}</span>
          <div class="pending-actions">
            <button
              type="button"
              class="pending-dismiss"
              :title="$t('recorder.dismissPending')"
              @click="dismissPending(fact)"
            >
              <font-awesome-icon icon="times" />
            </button>
            <button
              type="button"
              class="pending-action"
              :class="{ primary: isRecommended(fact) }"
              @click="commitPending(fact)"
            >
              {{ pendingActionLabel(fact) }}
            </button>
          </div>
        </div>
      </div>

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
            :script-roles="scriptRoles"
            :linked-mode="linkedMode"
            :initial-tokens="manualPrefillTokens"
            @record="onManualRecord"
            @dismiss="closeManualForm"
          />
          <div
            v-else-if="row.type === 'manualRecorded' && !isEditingManual(row.entry)"
            class="manual-recorded-card"
          >
            <button
              type="button"
              class="record-delete-btn"
              :title="$t('recorder.deleteRecord')"
              @click="confirmDeleteRecord(row.entry)"
            >
              <font-awesome-icon icon="trash-alt" />
            </button>
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
            :key="'edit-night-' + row.entry.id"
            :players="players"
            :script-roles="scriptRoles"
            :linked-mode="linkedMode"
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
            <button
              v-if="entry.category === 'manual'"
              type="button"
              class="record-delete-btn"
              :title="$t('recorder.deleteRecord')"
              @click="confirmDeleteRecord(entry)"
            >
              <font-awesome-icon icon="trash-alt" />
            </button>
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
            :script-roles="scriptRoles"
            :linked-mode="linkedMode"
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
          :initial-snapshot="deadVotePrefill"
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
          :script-roles="scriptRoles"
          :linked-mode="linkedMode"
          :initial-tokens="manualPrefillTokens"
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
import { pendingLabelKey, FACT_TYPES } from "../store/battleLogEffects";

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
      manualPrefillTokens: null,
      deadVotePrefill: null,
    };
  },
  watch: {
    "currentPhase.id"() {
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.editingManualId = null;
      this.manualPrefillTokens = null;
      this.deadVotePrefill = null;
      this.$store.dispatch("battleLog/clearPreviewEffects");
    },
  },
  computed: {
    ...mapState(["session", "roles"]),
    ...mapState("players", ["players"]),
    ...mapState("battleLog", ["entries", "gameMeta", "linkedMode"]),
    ...mapGetters("gamePhase", [
      "displayLabel",
      "currentPhase",
      "nightNumber",
      "subPhase",
    ]),
    ...mapGetters("battleLog", [
      "entryByRoleCardKey",
      "gameHeader",
      "openPendingFacts",
    ]),
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
    toggleLinkedMode(checked) {
      this.$store.dispatch("battleLog/setLinkedMode", checked);
      if (!checked) {
        this.$store.dispatch("battleLog/clearPreviewEffects");
      }
    },
    downloadFile(filename, content, mime) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    exportBattleLog() {
      const meta = this.gameMeta || {};
      const namePart = (meta.gameName || "戰報").replace(/[\\/:*?"<>|]/g, "_");
      Promise.resolve(this.$store.dispatch("battleLog/exportJson")).then(
        (data) => {
          this.downloadFile(
            `${namePart}_${Date.now()}.json`,
            data,
            "application/json",
          );
        },
      );
    },
    pickImportFile() {
      const input = this.$refs.importFile;
      if (input) {
        input.value = "";
        input.click();
      }
    },
    onImportFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const hasEntries =
            this.entries && this.entries.length > 0;
          if (
            hasEntries &&
            !window.confirm(this.$t("recorder.confirmImportReplace"))
          ) {
            return;
          }
          this.$store.dispatch("battleLog/importBattleLog", reader.result);
        } catch (e) {
          window.alert(this.$t("recorder.importFailed"));
          console.warn("import battle log failed", e);
        }
      };
      reader.readAsText(file, "utf-8");
    },
    deleteBattleLog() {
      if (!window.confirm(this.$t("recorder.confirmDeleteBattleLog"))) return;
      this.$store.dispatch("battleLog/resetForNewGame");
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.editingManualId = null;
      this.manualPrefillTokens = null;
      this.deadVotePrefill = null;
    },
    pendingLabel(fact) {
      const key = pendingLabelKey(fact.factType);
      return this.$t(key, { name: fact.playerName || "?" });
    },
    pendingActionLabel(fact) {
      if (fact.factType === FACT_TYPES.DEAD_VOTE) {
        return this.$t("recorder.writeDeadVote");
      }
      return this.$t("recorder.writeSource");
    },
    isRecommended(fact) {
      return (
        fact.factType === FACT_TYPES.DEAD_VOTE ||
        (fact.recommend && fact.recommend.card === "deadVote")
      );
    },
    dismissPending(fact) {
      if (!fact || !fact.id) return;
      this.$store.dispatch("battleLog/dismissPendingFact", fact.id);
    },
    commitPending(fact) {
      const rec = fact.recommend || {};
      if (rec.card === "deadVote" || fact.factType === FACT_TYPES.DEAD_VOTE) {
        this.manualFormOpen = false;
        this.voteFormOpen = false;
        this.editingManualId = null;
        this.deadVotePrefill = {
          players: (rec.prefill && rec.prefill.players) || [
            fact.playerName,
          ].filter(Boolean),
        };
        this.deadVoteFormOpen = true;
        return;
      }
      this.deadVoteFormOpen = false;
      this.voteFormOpen = false;
      this.editingManualId = null;
      this.manualPrefillTokens =
        rec.prefill && rec.prefill.tokens
          ? rec.prefill.tokens
          : [
              { type: "player", value: fact.playerName },
              {
                type: "status",
                value:
                  fact.factType === FACT_TYPES.REVIVE
                    ? "復活"
                    : fact.factType === FACT_TYPES.EVENT_POISON
                      ? "中毒"
                      : fact.factType === FACT_TYPES.IDENTITY_DRUNK ||
                          fact.factType === FACT_TYPES.EVENT_DRUNK
                        ? "醉酒"
                        : fact.factType === FACT_TYPES.ABILITY_LOST
                          ? "失去能力"
                          : "死亡",
              },
            ];
      this.manualFormOpen = true;
    },
    updateMeta(field, value) {
      this.$store.commit("battleLog/setGameMeta", { [field]: value });
    },
    openManualForm() {
      this.editingManualId = null;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.manualPrefillTokens = null;
      this.manualFormOpen = true;
    },
    closeManualForm() {
      this.manualFormOpen = false;
      this.manualPrefillTokens = null;
      this.$store.dispatch("battleLog/clearPreviewEffects");
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
      this.deadVotePrefill = null;
      this.deadVoteFormOpen = true;
    },
    closeDeadVoteForm() {
      this.deadVoteFormOpen = false;
      this.deadVotePrefill = null;
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
      if (Array.isArray(tokens) && tokens.length) {
        return tokens.map((t) => ({
          type: t.type,
          value: t.value != null ? t.value : "",
          roleId: t.roleId || null,
        }));
      }
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
      this.$store.dispatch("battleLog/clearPreviewEffects");
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
      this.manualPrefillTokens = null;
      this.$store.dispatch("battleLog/clearPreviewEffects");
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
      this.deadVotePrefill = null;
    },
    onDeleteManual(entryId) {
      if (!entryId) return;
      this.$store.dispatch("battleLog/cancelManualEntry", entryId);
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
    },
    confirmDeleteRecord(entry) {
      if (!entry || !entry.id) return;
      if (!window.confirm(this.$t("recorder.confirmCancelRecord"))) return;
      this.onDeleteManual(entry.id);
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
.linked-mode-row {
  padding: 4px 8px 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.new-game-row {
  padding: 4px 8px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.new-game-label {
  display: block;
  font-size: 0.65rem;
  font-weight: bold;
  color: rgba(255, 214, 153, 0.85);
  margin-bottom: 4px;
  letter-spacing: 0.3px;
}

.new-game-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.new-game-btn {
  flex: 1 1 auto;
  min-width: 72px;
  padding: 4px 6px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.4);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.65rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    filter: brightness(1.12);
  }
  &.export {
    border-color: rgba(140, 255, 160, 0.45);
    color: #b8ffc8;
  }
  &.import {
    border-color: rgba(70, 213, 255, 0.45);
    color: #9ae8ff;
  }
  &.delete {
    border-color: rgba(206, 1, 0, 0.45);
    color: #ffaaaa;
  }
}

.linked-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  input {
    accent-color: #ffd699;
  }
}

.pending-block {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(90, 40, 0, 0.45);
  border: 1px solid rgba(255, 140, 60, 0.55);
  text-align: left;
}

.pending-title {
  font-size: 0.72rem;
  font-weight: bold;
  color: #ffb366;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pending-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  &:last-child {
    border-bottom: none;
  }
  &.recommended {
    .pending-label {
      color: #d4a8ff;
    }
  }
}

.pending-label {
  font-size: 0.72rem;
  color: #ffe0b3;
  flex: 1;
  word-break: break-word;
}

.pending-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pending-dismiss {
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 0, 0, 0.15);
  }
}

.pending-action {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid rgba(255, 200, 80, 0.45);
  background: rgba(80, 50, 0, 0.65);
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background: rgba(120, 75, 0, 0.85);
  }
  &.primary {
    border-color: rgba(200, 140, 255, 0.65);
    background: rgba(80, 40, 100, 0.75);
    &:hover {
      background: rgba(100, 50, 120, 0.9);
    }
  }
}

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
  position: relative;
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

.record-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  filter: none;
  opacity: 1;
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 0, 0, 0.15);
  }
}

.manual-label {
  font-size: 0.65rem;
  color: #ffd699;
  margin-bottom: 4px;
  padding-right: 28px;
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
