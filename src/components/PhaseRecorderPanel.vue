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
    </div>

    <div class="recorder-body">
      <template v-if="activeTab === 'preview'">
        <div class="game-header-line">
          {{ gameHeader || $t("recorder.gameHeaderEmpty") }}
        </div>
        <div class="new-game-row">
          <div class="new-game-actions">
            <button
              type="button"
              class="new-game-btn export"
              :title="$t('recorder.exportBattleLogText')"
              @click="exportBattleLogText"
            >
              {{ $t("recorder.exportBattleLogText") }}
            </button>
            <button
              type="button"
              class="new-game-btn export-json"
              :title="$t('recorder.exportBattleLogJson')"
              @click="exportBattleLogJson"
            >
              {{ $t("recorder.exportBattleLogJson") }}
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
        <div class="preview-toolbar">
          <label class="hide-nickname-toggle">
            <input type="checkbox" v-model="hideNickname" />
            <span>{{ $t("recorder.hideNickname") }}</span>
          </label>
          <label class="hide-nickname-toggle">
            <input type="checkbox" v-model="hideTimestamp" />
            <span>{{ $t("recorder.hideTimestamp") }}</span>
          </label>
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
            <li
              v-for="(e, eIdx) in section.entries"
              :key="e.id"
              class="preview-item"
            >
              <div class="preview-sort">
                <button
                  type="button"
                  class="sort-btn"
                  :disabled="eIdx === 0"
                  :title="$t('recorder.moveUp')"
                  @click="movePreviewEntry(section, e, -1)"
                >
                  <font-awesome-icon icon="chevron-up" />
                </button>
                <button
                  type="button"
                  class="sort-btn"
                  :disabled="eIdx === section.entries.length - 1"
                  :title="$t('recorder.moveDown')"
                  @click="movePreviewEntry(section, e, 1)"
                >
                  <font-awesome-icon icon="chevron-down" />
                </button>
              </div>
              <div class="preview-body">
                <span v-if="!hideTimestamp" class="preview-time">{{
                  formatTime(e.timestamp)
                }}</span>
                <span class="preview-msg">{{ entryMessage(e) }}</span>
                <span
                  v-if="e.detail && e.detail !== '無備註'"
                  class="preview-detail"
                  >└ {{ e.detail }}</span
                >
              </div>
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

        <div
          v-if="isNight && isFirstNight && setupCards.length"
          class="setup-block"
        >
          <h4 class="setup-title">{{ $t("recorder.setupTitle") }}</h4>
          <div
            v-for="card in setupCards"
            :key="card.roleCardKey"
            class="setup-card-wrap"
          >
            <RoleActionCard
              :player="card.player"
              :player-index="card.playerIndex"
              :role-card-key="card.roleCardKey"
              :setup-role-id="card.setupRoleId"
              :reminder="card.reminder"
              :players="players"
              :role-options="scriptRoles"
              :is-recorded="card.isRecorded"
              :recorded-entry="card.recordedEntry"
              :setup-mode="true"
              @record="onSetupRoleRecord"
              @delete="onDeleteRoleCard"
            />
          </div>
        </div>

        <template v-if="isNight">
          <div v-for="row in nightRows" :key="row.key">
            <div
              v-if="
                row.type === 'manualSlot' &&
                !manualFormOpen &&
                !optionalPickerOpen
              "
              class="add-actions-row"
            >
              <button
                type="button"
                class="add-manual-btn"
                @click="openManualForm"
              >
                {{ $t("recorder.addManual") }}
              </button>
              <button
                type="button"
                class="add-manual-btn add-optional-btn"
                @click="openOptionalPicker"
              >
                {{ $t("recorder.addOptional") }}
              </button>
            </div>
            <div
              v-else-if="row.type === 'manualSlot' && optionalPickerOpen"
              class="optional-picker"
            >
              <div class="optional-picker-head">
                <span>{{ $t("recorder.optionalTitle") }}</span>
                <button
                  type="button"
                  class="optional-dismiss"
                  @click="closeOptionalPicker"
                >
                  {{ $t("recorder.optionalDismiss") }}
                </button>
              </div>
              <p class="optional-hint">{{ $t("recorder.optionalPickHint") }}</p>
              <p v-if="!optionalCandidates.length" class="empty-hint">
                {{ $t("recorder.optionalEmpty") }}
              </p>
              <button
                v-for="c in optionalCandidates"
                :key="
                  'pick-' +
                  c.playerIndex +
                  '-' +
                  c.role.id +
                  '-' +
                  (c.cardKey || '')
                "
                type="button"
                class="optional-pick-btn"
                :class="{ disabled: c.onceUsed && !c.recordedThisPhase }"
                :disabled="c.onceUsed && !c.recordedThisPhase"
                @click="selectOptionalCandidate(c)"
              >
                <span class="optional-pick-label">{{ c.label }}</span>
                <span v-if="c.onceUsed" class="optional-once-tag">{{
                  $t("recorder.optionalOnceUsed")
                }}</span>
              </button>
            </div>
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
              v-else-if="
                row.type === 'manualRecorded' && !isEditingManual(row.entry)
              "
              class="manual-recorded-card sortable-card"
              :class="{
                'drag-over':
                  cardDrag &&
                  cardDrag.group === 'nightManual' &&
                  cardDragOverKey === row.entry.id,
                dragging:
                  cardDrag &&
                  cardDrag.group === 'nightManual' &&
                  cardDrag.key === row.entry.id,
              }"
              :data-sort-key="row.entry.id"
              :data-sort-group="'nightManual'"
            >
              <div class="entry-card-rail">
                <button
                  type="button"
                  class="drag-handle"
                  :title="$t('recorder.dragReorder')"
                  :aria-label="$t('recorder.dragReorder')"
                  @pointerdown.stop.prevent="
                    onEntryDragHandleStart('nightManual', row.entry.id, $event)
                  "
                >
                  <font-awesome-icon icon="arrows-alt" />
                </button>
              </div>
              <div class="record-actions">
                <button
                  type="button"
                  class="record-edit-btn"
                  :title="$t('recorder.editRecord')"
                  @click="startEditManual(row.entry)"
                >
                  {{ $t("recorder.editRecord") }}
                </button>
                <button
                  type="button"
                  class="record-delete-btn"
                  :title="$t('recorder.deleteRecord')"
                  @click="confirmDeleteRecord(row.entry)"
                >
                  <font-awesome-icon icon="trash-alt" />
                </button>
              </div>
              <div class="entry-card-head">
                <div class="manual-label">{{ $t("recorder.manualTitle") }}</div>
              </div>
              <div class="manual-summary">{{ row.entry.message }}</div>
              <span class="manual-detail" v-if="row.entry.detail"
                >└ {{ row.entry.detail }}</span
              >
            </div>
            <ManualLogCard
              v-else-if="
                row.type === 'manualRecorded' && isEditingManual(row.entry)
              "
              :key="'edit-night-' + row.entry.id"
              :players="players"
              :script-roles="scriptRoles"
              :linked-mode="linkedMode"
              :edit-entry-id="row.entry.id"
              :initial-tokens="manualEditTokens(row.entry)"
              :initial-use-result-line="manualEditUseResultLine(row.entry)"
              @record="onManualRecord"
              @delete="onDeleteManual"
              @dismiss="closeManualEdit"
            />
            <div
              v-else-if="row.type === 'optionalRole'"
              class="optional-card-wrap sortable-card"
              :class="{
                'drag-over':
                  cardDrag &&
                  cardDrag.group === 'nightOptional' &&
                  cardDragOverKey === row.card.roleCardKey,
                dragging:
                  cardDrag &&
                  cardDrag.group === 'nightOptional' &&
                  cardDrag.key === row.card.roleCardKey,
              }"
              :data-sort-key="row.card.roleCardKey"
              :data-sort-group="'nightOptional'"
            >
              <div v-if="!row.card.isRecorded" class="optional-card-bar">
                <span class="optional-card-tag">{{
                  $t("recorder.optionalTitle")
                }}</span>
                <button
                  type="button"
                  class="optional-dismiss"
                  @click="dismissOptionalCard(row.card)"
                >
                  {{ $t("recorder.optionalDismiss") }}
                </button>
              </div>
              <RoleActionCard
                :player="row.card.player"
                :player-index="row.card.playerIndex"
                :role-card-key="row.card.roleCardKey"
                :card-key="row.card.cardKey"
                :reminder="row.card.reminder"
                :players="players"
                :role-options="scriptRoles"
                :is-recorded="row.card.isRecorded"
                :recorded-entry="row.card.recordedEntry"
                :sortable="true"
                @drag-handle-start="
                  onCardDragHandleStart('nightOptional', $event)
                "
                @record="onOptionalRoleRecord"
                @delete="onDeleteRoleCard"
              />
            </div>
            <div
              v-else-if="row.type === 'role'"
              class="sortable-card"
              :class="{
                'drag-over':
                  cardDrag &&
                  cardDrag.group === 'night' &&
                  cardDragOverKey === row.card.roleCardKey,
                dragging:
                  cardDrag &&
                  cardDrag.group === 'night' &&
                  cardDrag.key === row.card.roleCardKey,
              }"
              :data-sort-key="row.card.roleCardKey"
              :data-sort-group="'night'"
            >
              <RoleActionCard
                :player="row.card.player"
                :player-index="row.card.playerIndex"
                :role-card-key="row.card.roleCardKey"
                :reminder="row.card.reminder"
                :players="players"
                :role-options="scriptRoles"
                :is-recorded="row.card.isRecorded"
                :recorded-entry="row.card.recordedEntry"
                :sortable="true"
                @drag-handle-start="onCardDragHandleStart('night', $event)"
                @record="onRoleRecord"
                @delete="onDeleteRoleCard"
              />
            </div>
          </div>
          <p v-if="!nightCards.length && !setupCards.length" class="empty-hint">
            {{ $t("recorder.noNightActions") }}
          </p>
        </template>

        <template v-else>
          <div v-if="dayAbilityCards.length" class="day-ability-block">
            <h4 class="day-ability-title">
              {{ $t("recorder.dayAbilityTitle") }}
            </h4>
            <p class="day-ability-hint">{{ $t("recorder.dayAbilityHint") }}</p>
            <div
              v-for="card in dayAbilityCards"
              :key="'day-ability-' + card.roleCardKey"
              class="day-ability-card-wrap sortable-card"
              :class="{
                'drag-over':
                  cardDrag &&
                  cardDrag.group === 'dayAbility' &&
                  cardDragOverKey === card.roleCardKey,
                dragging:
                  cardDrag &&
                  cardDrag.group === 'dayAbility' &&
                  cardDrag.key === card.roleCardKey,
              }"
              :data-sort-key="card.roleCardKey"
              :data-sort-group="'dayAbility'"
            >
              <RoleActionCard
                :player="card.player"
                :player-index="card.playerIndex"
                :role-card-key="card.roleCardKey"
                :card-key="card.cardKey"
                :day-mode="true"
                :day-number="dayNumber"
                :reminder="card.reminder"
                :players="players"
                :role-options="scriptRoles"
                :is-recorded="card.isRecorded"
                :recorded-entry="card.recordedEntry"
                :sortable="true"
                @drag-handle-start="onCardDragHandleStart('dayAbility', $event)"
                @record="onOptionalRoleRecord"
                @delete="onDeleteRoleCard"
              />
            </div>
          </div>
          <template v-for="entry in phaseDayEntries">
            <div
              v-if="!isEditingEntry(entry)"
              :key="'rec-' + (entry.manualKey || entry.id)"
              class="manual-recorded-card sortable-card"
              :class="{
                vote: entry.category === 'vote',
                scaffold: entry.category === 'voteScaffold',
                execution:
                  entry.category === 'execution' ||
                  entry.category === 'noExecution',
                alive: entry.category === 'alivePlayers',
                'dead-vote': entry.category === 'deadVote',
                'drag-over':
                  cardDrag &&
                  cardDrag.group === 'dayEntry' &&
                  cardDragOverKey === entry.id,
                dragging:
                  cardDrag &&
                  cardDrag.group === 'dayEntry' &&
                  cardDrag.key === entry.id,
              }"
              :data-sort-key="entry.id"
              :data-sort-group="'dayEntry'"
            >
              <div class="entry-card-rail">
                <button
                  type="button"
                  class="drag-handle"
                  :title="$t('recorder.dragReorder')"
                  :aria-label="$t('recorder.dragReorder')"
                  @pointerdown.stop.prevent="
                    onEntryDragHandleStart('dayEntry', entry.id, $event)
                  "
                >
                  <font-awesome-icon icon="arrows-alt" />
                </button>
              </div>
              <div class="record-actions">
                <button
                  type="button"
                  class="record-edit-btn"
                  :title="$t('recorder.editRecord')"
                  @click="startEditEntry(entry)"
                >
                  {{ $t("recorder.editRecord") }}
                </button>
                <button
                  v-if="canDeleteEntry(entry)"
                  type="button"
                  class="record-delete-btn"
                  :title="$t('recorder.deleteRecord')"
                  @click="confirmDeleteRecord(entry)"
                >
                  <font-awesome-icon icon="trash-alt" />
                </button>
              </div>
              <div class="entry-card-head">
                <div class="manual-label">{{ entryCardLabel(entry) }}</div>
              </div>
              <div class="manual-summary">{{ entry.message }}</div>
              <span class="manual-detail" v-if="entry.detail"
                >└ {{ entry.detail }}</span
              >
            </div>
            <VoteLogCard
              v-else-if="entry.category === 'vote'"
              :key="'edit-vote-' + (entry.manualKey || entry.id)"
              :players="players"
              :day-votes="dayVoteSnapshots"
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
              :initial-use-result-line="manualEditUseResultLine(entry)"
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
            :day-votes="dayVoteSnapshots"
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
            v-if="isDusk && !executionFormOpen"
            type="button"
            class="add-manual-btn add-execution-btn"
            @click="openExecutionForm"
          >
            {{ $t("recorder.addExecution") }}
          </button>
          <ExecutionLogCard
            v-else-if="isDusk && executionFormOpen"
            :players="players"
            :default-nominee="duskNominee"
            @record="onExecutionRecord"
            @dismiss="closeExecutionForm"
          />
          <button
            v-if="!manualFormOpen && !optionalPickerOpen"
            type="button"
            class="add-manual-btn"
            @click="openManualForm"
          >
            {{ $t("recorder.addManual") }}
          </button>
          <button
            v-if="!manualFormOpen && !optionalPickerOpen"
            type="button"
            class="add-manual-btn add-optional-btn"
            @click="openOptionalPicker"
          >
            {{ $t("recorder.addOptional") }}
          </button>
          <div v-if="optionalPickerOpen && !isNight" class="optional-picker">
            <div class="optional-picker-head">
              <span>{{ $t("recorder.optionalTitle") }}</span>
              <button
                type="button"
                class="optional-dismiss"
                @click="closeOptionalPicker"
              >
                {{ $t("recorder.optionalDismiss") }}
              </button>
            </div>
            <p class="optional-hint">{{ $t("recorder.optionalPickHint") }}</p>
            <p v-if="!optionalCandidates.length" class="empty-hint">
              {{ $t("recorder.optionalEmpty") }}
            </p>
            <button
              v-for="c in optionalCandidates"
              :key="
                'day-pick-' +
                c.playerIndex +
                '-' +
                c.role.id +
                '-' +
                (c.cardKey || '')
              "
              type="button"
              class="optional-pick-btn"
              :class="{ disabled: c.onceUsed && !c.recordedThisPhase }"
              :disabled="c.onceUsed && !c.recordedThisPhase"
              @click="selectOptionalCandidate(c)"
            >
              <span class="optional-pick-label">{{ c.label }}</span>
              <span v-if="c.onceUsed" class="optional-once-tag">{{
                $t("recorder.optionalOnceUsed")
              }}</span>
            </button>
          </div>
          <div
            v-for="card in dayOptionalCards"
            :key="'day-opt-' + card.roleCardKey"
            class="optional-card-wrap sortable-card"
            :class="{
              'drag-over':
                cardDrag &&
                cardDrag.group === 'dayOptional' &&
                cardDragOverKey === card.roleCardKey,
              dragging:
                cardDrag &&
                cardDrag.group === 'dayOptional' &&
                cardDrag.key === card.roleCardKey,
            }"
            :data-sort-key="card.roleCardKey"
            :data-sort-group="'dayOptional'"
          >
            <div v-if="!card.isRecorded" class="optional-card-bar">
              <span class="optional-card-tag">{{
                $t("recorder.optionalTitle")
              }}</span>
              <button
                type="button"
                class="optional-dismiss"
                @click="dismissOptionalCard(card)"
              >
                {{ $t("recorder.optionalDismiss") }}
              </button>
            </div>
            <RoleActionCard
              :player="card.player"
              :player-index="card.playerIndex"
              :role-card-key="card.roleCardKey"
              :card-key="card.cardKey"
              :reminder="card.reminder"
              :players="players"
              :role-options="scriptRoles"
              :is-recorded="card.isRecorded"
              :recorded-entry="card.recordedEntry"
              :sortable="true"
              @drag-handle-start="onCardDragHandleStart('dayOptional', $event)"
              @record="onOptionalRoleRecord"
              @delete="onDeleteRoleCard"
            />
          </div>
          <ManualLogCard
            v-if="manualFormOpen"
            :players="players"
            :script-roles="scriptRoles"
            :linked-mode="linkedMode"
            :initial-tokens="manualPrefillTokens"
            @record="onManualRecord"
            @dismiss="closeManualForm"
          />
          <p class="empty-hint">
            {{
              isDusk
                ? $t("recorder.duskHint")
                : isVoting
                ? $t("recorder.votePhaseHint")
                : $t("recorder.dayHint")
            }}
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
import ExecutionLogCard from "./ExecutionLogCard";
import {
  roleHasNightAction,
  buildRoleCardKey,
  formatPlayerRoleLabel,
} from "../store/roleInputConfig";
import {
  getRule,
  getDayRule,
  getCardByKey,
  roleHasOptionalAction,
  roleHasSetupAction,
  roleHasDayAction,
  getSetupRule,
  buildSetupRoleCardKey,
  setupTaskNote,
  parseSetupRoleCardKey,
  shouldShowMarkOnlyDisguiseSetup,
  DISGUISE_SETUP_ROLE_IDS,
  isEvilDisguiseSetup,
  findDisguiseIdentityMarkerPlayerIndex,
  isDisguiseSetupSeat,
  listRoleCards,
  isDayAbilityCard,
  cardAppearsInNightOptional,
  cardAppearsInDayOptional,
  ruleAppliesToday,
} from "../store/roleInteractionEngine";
import { formatLogMessage } from "../store/modules/battleLog";
import { formatEntryForDisplay } from "../store/battleLogFormat";
import {
  pendingLabelKey,
  FACT_TYPES,
  resolvePlayerIndex,
} from "../store/battleLogEffects";

const SETUP_UNASSIGNED = -1;

const MANUAL_END = "__end__";

function parseRoleCardKey(roleCardKey) {
  if (!roleCardKey) return null;
  const parts = String(roleCardKey).split("|");
  if (parts.length < 3) return null;
  const roleId = parts[parts.length - 1];
  const playerIndex = parseInt(parts[parts.length - 2], 10);
  const phaseId = parts.slice(0, parts.length - 2).join("|");
  if (Number.isNaN(playerIndex)) return null;
  return { phaseId, playerIndex, roleId };
}

export default {
  name: "PhaseRecorderPanel",
  components: {
    RoleActionCard,
    ManualLogCard,
    VoteLogCard,
    DeadVoteLogCard,
    ExecutionLogCard,
  },
  data() {
    return {
      activeTab: "phase",
      manualFormOpen: false,
      voteFormOpen: false,
      deadVoteFormOpen: false,
      executionFormOpen: false,
      hideNickname: false,
      editingManualId: null,
      manualPrefillTokens: null,
      deadVotePrefill: null,
      optionalPickerOpen: false,
      /** @type {{ playerIndex: number, roleId: string } | null} */
      optionalDraft: null,
      /** roleCardKeys dismissed this phase (unrecorded optional cards) */
      dismissedOptionalKeys: [],
      /** @type {{ key: string, group: string, pointerId: number } | null} */
      cardDrag: null,
      cardDragOverKey: null,
    };
  },
  beforeDestroy() {
    this.teardownCardDragListeners();
  },
  watch: {
    "currentPhase.id"() {
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.executionFormOpen = false;
      this.editingManualId = null;
      this.manualPrefillTokens = null;
      this.deadVotePrefill = null;
      this.optionalPickerOpen = false;
      this.optionalDraft = null;
      this.dismissedOptionalKeys = [];
      this.endCardDrag();
      this.$store.dispatch("battleLog/clearPreviewEffects");
      this.$nextTick(() => {
        this.maybeAutoOpenExecutionForm();
      });
    },
  },
  computed: {
    ...mapState(["session", "roles"]),
    ...mapState("players", ["players"]),
    ...mapState("battleLog", [
      "entries",
      "gameMeta",
      "linkedMode",
      "phaseOrders",
      "roleCardOrders",
    ]),
    ...mapState("interactionRules", ["overlay"]),
    ...mapGetters("gamePhase", [
      "displayLabel",
      "currentPhase",
      "nightNumber",
      "dayNumber",
      "subPhase",
    ]),
    ...mapGetters("battleLog", [
      "entryByRoleCardKey",
      "gameHeader",
      "openPendingFacts",
    ]),
    hideTimestamp: {
      get() {
        return this.$store.state.battleLog.hideTimestamp;
      },
      set(value) {
        this.$store.dispatch("battleLog/setHideTimestamp", value);
      },
    },
    previewSections() {
      const byPhase = new Map();
      this.entries.forEach((entry) => {
        if (!entry.phase) return;
        // Skip phase-transition noise; only real events under each phase
        if (entry.category === "phase") return;
        if (entry.source === "system" && entry.category !== "nightDeaths") {
          return;
        }
        const key = entry.phase.id || entry.phase.label;
        if (!key) return;
        if (!byPhase.has(key)) {
          byPhase.set(key, {
            key,
            label: entry.phase.label || key,
            entries: [],
            phase: entry.phase,
          });
        }
        byPhase.get(key).entries.push(entry);
      });

      const sections = [...byPhase.values()].filter((s) => s.entries.length);
      sections.forEach((section) => {
        const orderedIds = this.orderedEntryIdsForPhase(
          section.key,
          section.entries,
          section.phase,
        );
        const byId = new Map(section.entries.map((e) => [e.id, e]));
        const ordered = [];
        orderedIds.forEach((id) => {
          const e = byId.get(id);
          if (e) {
            ordered.push(e);
            byId.delete(id);
          }
        });
        // Append any leftovers not covered by the order list
        byId.forEach((e) => ordered.push(e));
        section.entries = ordered;
      });
      // Phase order follows game phase progression (first appearance in entries)
      const phaseFirstIndex = new Map();
      this.entries.forEach((entry, idx) => {
        if (!entry.phase) return;
        const key = entry.phase.id || entry.phase.label;
        if (key && !phaseFirstIndex.has(key)) phaseFirstIndex.set(key, idx);
      });
      sections.sort((a, b) => {
        const ia = phaseFirstIndex.has(a.key)
          ? phaseFirstIndex.get(a.key)
          : Number.MAX_SAFE_INTEGER;
        const ib = phaseFirstIndex.has(b.key)
          ? phaseFirstIndex.get(b.key)
          : Number.MAX_SAFE_INTEGER;
        return ia - ib;
      });
      return sections;
    },
    isNight() {
      return this.subPhase === "night";
    },
    isVoting() {
      return this.subPhase === "day-voting";
    },
    isDusk() {
      return this.subPhase === "dusk";
    },
    duskNominee() {
      const scaffold = [...this.entries]
        .reverse()
        .find(
          (e) =>
            e.category === "voteScaffold" &&
            e.formSnapshot &&
            !e.formSnapshot.empty &&
            e.formSnapshot.nominee,
        );
      return (scaffold && scaffold.formSnapshot.nominee) || "";
    },
    dayVoteSnapshots() {
      const id = this.currentPhase.id;
      return this.entries
        .filter(
          (e) =>
            e.phase &&
            e.phase.id === id &&
            e.category === "vote" &&
            e.source === "vote",
        )
        .map((e) => ({
          id: e.id,
          nominee:
            (e.formSnapshot && e.formSnapshot.nominee) ||
            (e.target !== "無" ? e.target : ""),
          voteCount:
            e.formSnapshot && e.formSnapshot.voteCount != null
              ? e.formSnapshot.voteCount
              : 0,
        }));
    },
    isFirstNight() {
      return this.nightNumber === 0;
    },
    setupCards() {
      if (!this.isNight || !this.isFirstNight) return [];
      const phaseId = this.currentPhase.id;
      const cards = [];
      const seen = new Set();
      const disguiseSetupRoles = DISGUISE_SETUP_ROLE_IDS;

      const pushCard = (playerIndex, setupRoleId, playerOverride = null) => {
        const player =
          playerOverride ||
          (playerIndex >= 0 ? this.players[playerIndex] : null);
        if (!setupRoleId) return;
        const dedupeKey = `${playerIndex}|${setupRoleId}`;
        if (seen.has(dedupeKey)) return;
        const roleCardKey = buildSetupRoleCardKey(
          phaseId,
          playerIndex,
          setupRoleId,
        );
        const recordedEntry = this.entryByRoleCardKey(roleCardKey);
        const setupRule = getSetupRule(setupRoleId, this.overlay);
        const placeholderPlayer =
          player || this.disguiseSetupPlaceholder(setupRoleId);
        if (!placeholderPlayer) return;
        cards.push({
          player: placeholderPlayer,
          playerIndex,
          setupRoleId,
          roleCardKey,
          reminder:
            (setupRule && setupRule.notes) ||
            setupTaskNote({ id: setupRoleId }, this.overlay),
          isRecorded: !!recordedEntry,
          recordedEntry,
        });
        seen.add(dedupeKey);
      };

      const hasRecordedDisguiseSetup = (setupRoleId) =>
        this.entries.some((e) => {
          if (
            !e ||
            e.source !== "roleCard" ||
            !e.phase ||
            e.phase.id !== phaseId
          )
            return false;
          const parsed = parseSetupRoleCardKey(e.roleCardKey);
          if (!parsed || parsed.roleId !== setupRoleId) return false;
          if (parsed.playerIndex >= 0) return true;
          const p1 =
            e.formSnapshot &&
            e.formSnapshot.formData &&
            e.formSnapshot.formData.p1;
          return !!(p1 && resolvePlayerIndex(this.players, p1) >= 0);
        });

      const isDisguiseRoleInScript = (setupRoleId) =>
        (this.scriptRoles || []).some(
          (r) =>
            r &&
            String(r.id || "").toLowerCase() ===
              String(setupRoleId || "").toLowerCase(),
        );

      this.players.forEach((player, playerIndex) => {
        const role = player.role;
        if (!roleHasSetupAction(role, this.overlay)) return;
        const id = String(role.id || "").toLowerCase();
        if (disguiseSetupRoles.has(id)) return;
        pushCard(playerIndex, role.id);
      });

      disguiseSetupRoles.forEach((setupRoleId) => {
        if (!isDisguiseRoleInScript(setupRoleId)) return;
        const assignedIdx = this.players.findIndex(
          (p) =>
            p.role && String(p.role.id || "").toLowerCase() === setupRoleId,
        );
        if (assignedIdx >= 0) {
          pushCard(assignedIdx, setupRoleId);
        } else if (isEvilDisguiseSetup(setupRoleId)) {
          const markedIdx = findDisguiseIdentityMarkerPlayerIndex(
            this.players,
            setupRoleId,
          );
          if (markedIdx >= 0 && !hasRecordedDisguiseSetup(setupRoleId)) {
            pushCard(markedIdx, setupRoleId);
          }
        } else if (
          shouldShowMarkOnlyDisguiseSetup(this.players, setupRoleId) &&
          !hasRecordedDisguiseSetup(setupRoleId)
        ) {
          pushCard(SETUP_UNASSIGNED, setupRoleId);
        }
      });

      this.entries.forEach((e) => {
        if (!e || e.source !== "roleCard" || !e.roleCardKey) return;
        if (!e.phase || e.phase.id !== phaseId) return;
        const parsed = parseSetupRoleCardKey(e.roleCardKey);
        if (!parsed || !disguiseSetupRoles.has(parsed.roleId)) return;
        if (!isDisguiseRoleInScript(parsed.roleId)) return;
        if (
          isEvilDisguiseSetup(parsed.roleId) &&
          e.formSnapshot &&
          e.formSnapshot.setupVariant === "markOnly"
        ) {
          return;
        }
        let playerIndex = parsed.playerIndex;
        if (playerIndex < 0) {
          const p1 =
            e.formSnapshot &&
            e.formSnapshot.formData &&
            e.formSnapshot.formData.p1;
          if (p1) playerIndex = resolvePlayerIndex(this.players, p1);
        }
        if (playerIndex >= 0) pushCard(playerIndex, parsed.roleId);
      });

      return cards.filter((card) => {
        if (!isEvilDisguiseSetup(card.setupRoleId)) return true;
        return isDisguiseSetupSeat(
          this.players,
          card.setupRoleId,
          card.playerIndex,
        );
      });
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
        if (!roleHasNightAction(role, this.isFirstNight, this.overlay)) return;
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
      return this.applyRoleCardOrder(cards);
    },
    optionalCandidates() {
      const phaseId = this.currentPhase.id;
      const list = [];
      this.players.forEach((player, playerIndex) => {
        const role = player.role;
        if (!role || !role.id) return;
        const cards = listRoleCards(role.id, this.overlay);
        const usable = cards.filter((card) => {
          if (this.isNight) return cardAppearsInNightOptional(card);
          if (
            isDayAbilityCard(card) &&
            ruleAppliesToday(card, this.dayNumber)
          ) {
            return false;
          }
          return cardAppearsInDayOptional(card, this.dayNumber);
        });
        if (!usable.length) return;
        const roleCardKey = buildRoleCardKey(phaseId, playerIndex, role.id);
        const recordedThisPhase = !!this.entryByRoleCardKey(roleCardKey);
        usable.forEach((card) => {
          const onceUsed = !!(
            card.once && this.isOptionalOnceUsed(playerIndex, role.id)
          );
          list.push({
            player,
            playerIndex,
            role,
            rule: card,
            cardKey: card.cardKey || card.key || "",
            onceUsed,
            recordedThisPhase,
            label: this.formatOptionalCandidateLabel(player, playerIndex, card),
          });
        });
      });
      return list;
    },
    dayAbilityCards() {
      if (this.isNight) return [];
      const phaseId = this.currentPhase.id;
      const cards = [];
      this.players.forEach((player, playerIndex) => {
        const role = player.role;
        if (!roleHasDayAction(role, this.dayNumber, this.overlay)) return;
        const dayRule = getDayRule(role.id, this.dayNumber, this.overlay);
        if (!dayRule) return;
        const roleCardKey = buildRoleCardKey(phaseId, playerIndex, role.id);
        const recordedEntry = this.entryByRoleCardKey(roleCardKey);
        cards.push({
          player,
          playerIndex,
          roleCardKey,
          cardKey: dayRule.cardKey,
          reminder: dayRule.notes || "",
          isRecorded: !!recordedEntry,
          recordedEntry,
        });
      });
      return this.applyRoleCardOrder(cards);
    },
    optionalCards() {
      const phaseId = this.currentPhase.id;
      const nightKeys = new Set(this.nightCards.map((c) => c.roleCardKey));
      const dayKeys = new Set(this.dayAbilityCards.map((c) => c.roleCardKey));
      const cards = [];
      const seen = new Set();
      const dismissed = new Set(this.dismissedOptionalKeys || []);

      const pushCard = (playerIndex, roleId, cardKey = "") => {
        const player = this.players[playerIndex];
        if (!player || !player.role) return;
        const id = roleId || (player.role && player.role.id);
        if (!id) return;
        const roleCardKey = buildRoleCardKey(phaseId, playerIndex, id);
        if (
          seen.has(roleCardKey) ||
          nightKeys.has(roleCardKey) ||
          dayKeys.has(roleCardKey)
        ) {
          return;
        }
        const recordedEntry = this.entryByRoleCardKey(roleCardKey);
        if (!recordedEntry && dismissed.has(roleCardKey)) return;
        const rule =
          (cardKey && getCardByKey(id, cardKey, this.overlay)) ||
          (cardKey && getDayRule(id, this.dayNumber, this.overlay)) ||
          getRule(id, this.overlay) ||
          getCardByKey(id, cardKey, this.overlay);
        cards.push({
          player,
          playerIndex,
          roleCardKey,
          cardKey: cardKey || (rule && (rule.cardKey || rule.key)) || "",
          reminder: (rule && rule.notes) || "",
          isRecorded: !!recordedEntry,
          recordedEntry,
          insertBeforeRoleCardKey:
            recordedEntry && recordedEntry.insertBeforeRoleCardKey != null
              ? recordedEntry.insertBeforeRoleCardKey
              : recordedEntry
              ? MANUAL_END
              : this.isNight
              ? this.insertBeforeRoleCardKey
              : MANUAL_END,
        });
        seen.add(roleCardKey);
      };

      if (this.optionalDraft) {
        pushCard(
          this.optionalDraft.playerIndex,
          this.optionalDraft.roleId,
          this.optionalDraft.cardKey || "",
        );
      }

      this.entries.forEach((e) => {
        if (!e || e.source !== "roleCard" || !e.roleCardKey) return;
        if (!e.phase || e.phase.id !== phaseId) return;
        const parsed = parseRoleCardKey(e.roleCardKey);
        if (!parsed) return;
        if (!roleHasOptionalAction({ id: parsed.roleId }, this.overlay)) {
          return;
        }
        // Skip if this is an auto day-ability already listed
        if (
          !this.isNight &&
          roleHasDayAction({ id: parsed.roleId }, this.dayNumber, this.overlay)
        ) {
          return;
        }
        const snapKey =
          e.formSnapshot && e.formSnapshot.cardKey
            ? e.formSnapshot.cardKey
            : "";
        pushCard(parsed.playerIndex, parsed.roleId, snapKey);
      });

      return this.applyRoleCardOrder(cards);
    },
    dayOptionalCards() {
      if (this.isNight) return [];
      return this.optionalCards;
    },
    phaseManualEntries() {
      const id = this.currentPhase.id;
      const list = this.entries.filter(
        (e) =>
          e.phase &&
          e.phase.id === id &&
          e.source === "manual" &&
          e.category === "manual",
      );
      const order = this.phaseOrders && this.phaseOrders[id];
      if (!order || !order.length) return list;
      const rank = new Map(order.map((eid, i) => [eid, i]));
      return list.slice().sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
        const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return 0;
      });
    },
    phaseDayEntries() {
      const id = this.currentPhase.id;
      const extraCategories = [
        "voteScaffold",
        "execution",
        "noExecution",
        "alivePlayers",
      ];
      const list = this.entries.filter(
        (e) =>
          e.phase &&
          e.phase.id === id &&
          ((e.source === "manual" && e.category === "manual") ||
            (e.source === "vote" &&
              (e.category === "vote" || e.category === "voteScaffold")) ||
            (e.source === "deadVote" && e.category === "deadVote") ||
            (e.source === "execution" &&
              (e.category === "execution" || e.category === "noExecution")) ||
            (e.source === "system" && e.category === "alivePlayers") ||
            extraCategories.includes(e.category)),
      );
      const order = this.phaseOrders && this.phaseOrders[id];
      if (!order || !order.length) return list;
      const rank = new Map(order.map((eid, i) => [eid, i]));
      return list.slice().sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
        const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return 0;
      });
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
      const optionals = this.optionalCards || [];
      const usedManuals = new Set();
      const usedOptionals = new Set();
      const customOrder =
        (this.phaseOrders && this.phaseOrders[this.currentPhase.id]) || null;

      const insertKeyOf = (entry) =>
        entry.insertBeforeRoleCardKey == null
          ? MANUAL_END
          : entry.insertBeforeRoleCardKey;

      const pushManualsBefore = (beforeKey) => {
        manuals
          .filter((m) => insertKeyOf(m) === beforeKey)
          .forEach((m) => {
            rows.push({
              type: "manualRecorded",
              key: m.manualKey || m.id,
              entry: m,
            });
            usedManuals.add(m.id);
          });
      };

      const pushOptionalsBefore = (beforeKey, { recordedOnly } = {}) => {
        optionals
          .filter((card) => {
            if (usedOptionals.has(card.roleCardKey)) return false;
            if (recordedOnly && !card.isRecorded) return false;
            if (!recordedOnly && card.isRecorded) return false;
            const key = card.isRecorded
              ? card.insertBeforeRoleCardKey == null
                ? MANUAL_END
                : card.insertBeforeRoleCardKey
              : this.insertBeforeRoleCardKey;
            return key === beforeKey;
          })
          .forEach((card) => {
            rows.push({
              type: "optionalRole",
              key: "opt-" + card.roleCardKey,
              card,
            });
            usedOptionals.add(card.roleCardKey);
          });
      };

      const insertAt =
        this.firstUnrecordedIndex < 0
          ? this.nightCards.length
          : this.firstUnrecordedIndex;

      const pushInsertablesBefore = (beforeKey, includeDrafts) => {
        pushManualsBefore(beforeKey);
        pushOptionalsBefore(beforeKey, { recordedOnly: true });
        if (includeDrafts) {
          pushOptionalsBefore(beforeKey, { recordedOnly: false });
        }
      };

      // When a custom phase order exists, place recorded items in that
      // sequence while keeping unrecorded night roles in script order.
      if (customOrder && customOrder.length) {
        const entryById = new Map(this.entries.map((e) => [e.id, e]));
        const nightKeySet = new Set(this.nightCards.map((c) => c.roleCardKey));
        const nightCardByKey = new Map(
          this.nightCards.map((c) => [c.roleCardKey, c]),
        );
        const optionalByKey = new Map(optionals.map((c) => [c.roleCardKey, c]));
        const shownNight = new Set();
        let slotPlaced = false;

        const flushUnrecordedBefore = (roleCardKey) => {
          for (const card of this.nightCards) {
            if (card.roleCardKey === roleCardKey) break;
            if (shownNight.has(card.roleCardKey)) continue;
            if (card.isRecorded) continue;
            if (
              !slotPlaced &&
              card.roleCardKey === this.nightCards[insertAt]?.roleCardKey
            ) {
              rows.push({ type: "manualSlot", key: "manual-slot" });
              optionals
                .filter(
                  (c) => !c.isRecorded && !usedOptionals.has(c.roleCardKey),
                )
                .forEach((c) => {
                  rows.push({
                    type: "optionalRole",
                    key: "opt-" + c.roleCardKey,
                    card: c,
                  });
                  usedOptionals.add(c.roleCardKey);
                });
              slotPlaced = true;
            }
            rows.push({ type: "role", key: card.roleCardKey, card });
            shownNight.add(card.roleCardKey);
          }
        };

        customOrder.forEach((id) => {
          const entry = entryById.get(id);
          if (!entry) return;
          if (entry.source === "manual" && entry.category === "manual") {
            rows.push({
              type: "manualRecorded",
              key: entry.manualKey || entry.id,
              entry,
            });
            usedManuals.add(entry.id);
            return;
          }
          if (entry.source === "roleCard" && entry.roleCardKey) {
            if (nightKeySet.has(entry.roleCardKey)) {
              flushUnrecordedBefore(entry.roleCardKey);
              const card = nightCardByKey.get(entry.roleCardKey);
              if (card && !shownNight.has(entry.roleCardKey)) {
                if (
                  !slotPlaced &&
                  this.nightCards[insertAt] &&
                  this.nightCards[insertAt].roleCardKey === entry.roleCardKey
                ) {
                  rows.push({ type: "manualSlot", key: "manual-slot" });
                  optionals
                    .filter(
                      (c) => !c.isRecorded && !usedOptionals.has(c.roleCardKey),
                    )
                    .forEach((c) => {
                      rows.push({
                        type: "optionalRole",
                        key: "opt-" + c.roleCardKey,
                        card: c,
                      });
                      usedOptionals.add(c.roleCardKey);
                    });
                  slotPlaced = true;
                }
                rows.push({ type: "role", key: card.roleCardKey, card });
                shownNight.add(card.roleCardKey);
              }
              return;
            }
            const opt = optionalByKey.get(entry.roleCardKey);
            if (opt) {
              rows.push({
                type: "optionalRole",
                key: "opt-" + opt.roleCardKey,
                card: opt,
              });
              usedOptionals.add(opt.roleCardKey);
            }
          }
        });

        // Remaining unrecorded night cards + slot + leftovers
        this.nightCards.forEach((card, idx) => {
          if (shownNight.has(card.roleCardKey)) return;
          if (!slotPlaced && idx === insertAt) {
            rows.push({ type: "manualSlot", key: "manual-slot" });
            optionals
              .filter((c) => !c.isRecorded && !usedOptionals.has(c.roleCardKey))
              .forEach((c) => {
                rows.push({
                  type: "optionalRole",
                  key: "opt-" + c.roleCardKey,
                  card: c,
                });
                usedOptionals.add(c.roleCardKey);
              });
            slotPlaced = true;
          }
          rows.push({ type: "role", key: card.roleCardKey, card });
          shownNight.add(card.roleCardKey);
        });
        if (!slotPlaced) {
          rows.push({ type: "manualSlot", key: "manual-slot-end" });
          optionals
            .filter((c) => !c.isRecorded && !usedOptionals.has(c.roleCardKey))
            .forEach((c) => {
              rows.push({
                type: "optionalRole",
                key: "opt-" + c.roleCardKey,
                card: c,
              });
              usedOptionals.add(c.roleCardKey);
            });
        }
        manuals
          .filter((m) => !usedManuals.has(m.id))
          .forEach((m) => {
            rows.push({
              type: "manualRecorded",
              key: m.manualKey || m.id,
              entry: m,
            });
          });
        optionals
          .filter((c) => c.isRecorded && !usedOptionals.has(c.roleCardKey))
          .forEach((c) => {
            rows.push({
              type: "optionalRole",
              key: "opt-" + c.roleCardKey,
              card: c,
            });
          });
        return rows;
      }

      if (!this.nightCards.length) {
        pushInsertablesBefore(MANUAL_END, true);
        manuals
          .filter((m) => !usedManuals.has(m.id))
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
        const atInsert = idx === insertAt;
        pushInsertablesBefore(card.roleCardKey, atInsert);
        if (atInsert) {
          rows.push({ type: "manualSlot", key: "manual-slot" });
        }
        rows.push({ type: "role", key: card.roleCardKey, card });
      });
      pushInsertablesBefore(MANUAL_END, insertAt >= this.nightCards.length);
      if (insertAt >= this.nightCards.length) {
        rows.push({ type: "manualSlot", key: "manual-slot-end" });
      }
      manuals
        .filter((m) => !usedManuals.has(m.id))
        .forEach((m) => {
          rows.push({
            type: "manualRecorded",
            key: m.manualKey || m.id,
            entry: m,
          });
        });
      optionals
        .filter((c) => !usedOptionals.has(c.roleCardKey))
        .forEach((card) => {
          rows.push({
            type: "optionalRole",
            key: "opt-" + card.roleCardKey,
            card,
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
            e.source === "deadVote" ||
            e.source === "execution" ||
            (e.source === "system" &&
              (e.category === "alivePlayers" || e.category === "nightDeaths"))),
      );
    },
  },
  methods: {
    formatOptionalCandidateLabel(player, playerIndex, card) {
      const base = formatPlayerRoleLabel(player, playerIndex);
      const key = String((card && (card.cardKey || card.key)) || "").toLowerCase();
      const label = String((card && (card.cardLabel || card.label)) || "").toLowerCase();
      if (key === "skip" || label === "skip") return `${base} — 跳過`;
      if (key === "other-night-x3" || label === "othernightx3") {
        return `${base} — 三殺`;
      }
      if (key === "death" && String(card.id || "").toLowerCase() === "zombuul") {
        return `${base} — 假死`;
      }
      if (key === "trigger-defeat" || label === "triggerdefeat") {
        return `${base} — 陣營落敗`;
      }
      if (key === "trigger-extend" || label === "triggerextend") {
        return `${base} — 延長一天`;
      }
      return base;
    },
    applyRoleCardOrder(cards) {
      const phaseId = this.currentPhase && this.currentPhase.id;
      const order =
        phaseId && this.roleCardOrders && this.roleCardOrders[phaseId];
      if (!order || !order.length || !cards || !cards.length) return cards;
      const rank = new Map(order.map((key, i) => [key, i]));
      return cards.slice().sort((a, b) => {
        const ra = rank.has(a.roleCardKey)
          ? rank.get(a.roleCardKey)
          : Number.MAX_SAFE_INTEGER;
        const rb = rank.has(b.roleCardKey)
          ? rank.get(b.roleCardKey)
          : Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return 0;
      });
    },
    sortableKeysForGroup(group) {
      if (group === "night") {
        return (this.nightCards || []).map((c) => c.roleCardKey);
      }
      if (group === "nightOptional") {
        return (this.optionalCards || []).map((c) => c.roleCardKey);
      }
      if (group === "nightManual") {
        return (this.phaseManualEntries || []).map((e) => e.id);
      }
      if (group === "dayAbility") {
        return (this.dayAbilityCards || []).map((c) => c.roleCardKey);
      }
      if (group === "dayOptional") {
        return (this.dayOptionalCards || []).map((c) => c.roleCardKey);
      }
      if (group === "dayEntry") {
        return (this.phaseDayEntries || []).map((e) => e.id);
      }
      return [];
    },
    onEntryDragHandleStart(group, entryId, event) {
      if (!entryId || !event) return;
      this.onCardDragHandleStart(group, {
        roleCardKey: entryId,
        pointerId: event.pointerId,
      });
    },
    onCardDragHandleStart(group, payload) {
      if (!payload || !payload.roleCardKey) return;
      this.teardownCardDragListeners();
      this.cardDrag = {
        key: payload.roleCardKey,
        group,
        pointerId: payload.pointerId,
        kind:
          group === "nightManual" || group === "dayEntry" ? "entry" : "role",
      };
      this.cardDragOverKey = payload.roleCardKey;
      document.body.classList.add("card-dragging");
      window.addEventListener("pointermove", this.onCardDragPointerMove, {
        passive: false,
      });
      window.addEventListener("pointerup", this.onCardDragPointerUp, {
        passive: false,
      });
      window.addEventListener("pointercancel", this.onCardDragPointerUp, {
        passive: false,
      });
    },
    onCardDragPointerMove(event) {
      if (!this.cardDrag) return;
      if (
        this.cardDrag.pointerId != null &&
        event.pointerId !== this.cardDrag.pointerId
      ) {
        return;
      }
      event.preventDefault();
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const wrap =
        el && el.closest
          ? el.closest(
              `.sortable-card[data-sort-group="${this.cardDrag.group}"]`,
            )
          : null;
      const key = wrap && wrap.getAttribute("data-sort-key");
      this.cardDragOverKey = key || this.cardDrag.key;
    },
    onCardDragPointerUp(event) {
      if (!this.cardDrag) return;
      if (
        this.cardDrag.pointerId != null &&
        event.pointerId !== this.cardDrag.pointerId
      ) {
        return;
      }
      const fromKey = this.cardDrag.key;
      const toKey = this.cardDragOverKey || fromKey;
      const group = this.cardDrag.group;
      const kind = this.cardDrag.kind;
      this.endCardDrag();
      if (!fromKey || !toKey || fromKey === toKey) return;
      if (kind === "entry") {
        this.commitEntryReorder(group, fromKey, toKey);
      } else {
        this.commitCardReorder(group, fromKey, toKey);
      }
    },
    commitEntryReorder(group, fromId, toId) {
      const groupKeys = this.sortableKeysForGroup(group);
      const from = groupKeys.indexOf(fromId);
      const to = groupKeys.indexOf(toId);
      if (from < 0 || to < 0 || from === to) return;
      const nextGroup = groupKeys.slice();
      nextGroup.splice(from, 1);
      nextGroup.splice(to, 0, fromId);

      const phaseId = this.currentPhase.id;
      const fallback = this.orderedEntryIdsForPhase(
        phaseId,
        this.entries.filter((e) => e.phase && e.phase.id === phaseId),
        this.currentPhase,
      );
      const existing =
        (this.phaseOrders &&
          this.phaseOrders[phaseId] &&
          this.phaseOrders[phaseId].length &&
          this.phaseOrders[phaseId].slice()) ||
        fallback;
      const groupSet = new Set(groupKeys);
      const firstIdx = existing.findIndex((id) => groupSet.has(id));
      const without = existing.filter((id) => !groupSet.has(id));
      let merged;
      if (firstIdx < 0) {
        merged = without.concat(nextGroup);
      } else {
        merged = without.slice();
        const insertAt = Math.min(firstIdx, merged.length);
        merged.splice(insertAt, 0, ...nextGroup);
      }
      const seen = new Set();
      const deduped = [];
      merged.forEach((id) => {
        if (seen.has(id)) return;
        seen.add(id);
        deduped.push(id);
      });
      this.$store.commit("battleLog/setPhaseOrder", {
        phaseId,
        order: deduped,
      });
    },
    commitCardReorder(group, fromKey, toKey) {
      const groupKeys = this.sortableKeysForGroup(group);
      const from = groupKeys.indexOf(fromKey);
      const to = groupKeys.indexOf(toKey);
      if (from < 0 || to < 0 || from === to) return;
      const nextGroup = groupKeys.slice();
      nextGroup.splice(from, 1);
      nextGroup.splice(to, 0, fromKey);

      const phaseId = this.currentPhase.id;
      const existing =
        (this.roleCardOrders && this.roleCardOrders[phaseId]) || [];
      const groupSet = new Set(groupKeys);
      const preserved = existing.filter((k) => !groupSet.has(k));
      const merged = nextGroup.concat(preserved);
      const fallbackEntryOrder = this.orderedEntryIdsForPhase(
        phaseId,
        this.entries.filter((e) => e.phase && e.phase.id === phaseId),
        this.currentPhase,
      );
      this.$store.dispatch("battleLog/reorderRoleCards", {
        phaseId,
        order: merged,
        fallbackEntryOrder,
      });
    },
    entryCardLabel(entry) {
      if (!entry) return this.$t("recorder.manualTitle");
      if (entry.category === "vote") return this.$t("recorder.voteTitle");
      if (entry.category === "voteScaffold")
        return this.$t("recorder.voteScaffoldTitle");
      if (entry.category === "execution")
        return this.$t("recorder.executionTitle");
      if (entry.category === "noExecution")
        return this.$t("recorder.noExecution");
      if (entry.category === "alivePlayers")
        return this.$t("recorder.alivePlayersTitle");
      if (entry.category === "deadVote")
        return this.$t("recorder.deadVoteTitle");
      return this.$t("recorder.manualTitle");
    },
    canDeleteEntry(entry) {
      if (!entry) return false;
      return [
        "manual",
        "vote",
        "deadVote",
        "execution",
        "noExecution",
        "alivePlayers",
      ].includes(entry.category);
    },
    endCardDrag() {
      this.teardownCardDragListeners();
      this.cardDrag = null;
      this.cardDragOverKey = null;
      document.body.classList.remove("card-dragging");
    },
    teardownCardDragListeners() {
      window.removeEventListener("pointermove", this.onCardDragPointerMove);
      window.removeEventListener("pointerup", this.onCardDragPointerUp);
      window.removeEventListener("pointercancel", this.onCardDragPointerUp);
    },
    disguiseSetupPlaceholder(setupRoleId) {
      const id = String(setupRoleId || "").toLowerCase();
      const fromScript = (this.scriptRoles || []).find(
        (r) => r && String(r.id || "").toLowerCase() === id,
      );
      if (fromScript) return { name: "", id: "", role: { ...fromScript } };
      const fromStore =
        this.roles && typeof this.roles.get === "function"
          ? this.roles.get(id)
          : null;
      if (fromStore) return { name: "", id: "", role: { ...fromStore } };
      const fallbackName =
        id === "marionette"
          ? "提線木偶"
          : id === "lunatic"
            ? "瘋子"
            : "酒鬼";
      return { name: "", id: "", role: { id, name: fallbackName } };
    },
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
    exportFileBaseName() {
      const meta = this.gameMeta || {};
      return (meta.gameName || "戰報").replace(/[\\/:*?"<>|]/g, "_");
    },
    exportBattleLogText() {
      const namePart = this.exportFileBaseName();
      Promise.resolve(
        this.$store.dispatch("battleLog/exportReplayText", {
          hideNickname: this.hideNickname,
        }),
      ).then((data) => {
        this.downloadFile(
          `${namePart}_${Date.now()}.txt`,
          data,
          "text/plain;charset=utf-8",
        );
      });
    },
    exportBattleLogJson() {
      const namePart = this.exportFileBaseName();
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
          const hasEntries = this.entries && this.entries.length > 0;
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
      this.executionFormOpen = false;
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
          players:
            (rec.prefill && rec.prefill.players) ||
            [fact.playerName].filter(Boolean),
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
      this.optionalPickerOpen = false;
      this.optionalDraft = null;
      this.manualPrefillTokens = null;
      this.manualFormOpen = true;
    },
    closeManualForm() {
      this.manualFormOpen = false;
      this.manualPrefillTokens = null;
      this.$store.dispatch("battleLog/clearPreviewEffects");
    },
    openOptionalPicker() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.executionFormOpen = false;
      this.optionalDraft = null;
      this.optionalPickerOpen = true;
    },
    closeOptionalPicker() {
      this.optionalPickerOpen = false;
    },
    dismissOptionalDraft() {
      this.optionalDraft = null;
      this.optionalPickerOpen = false;
      this.$store.dispatch("battleLog/clearPreviewEffects");
    },
    dismissOptionalCard(card) {
      if (!card) {
        this.dismissOptionalDraft();
        return;
      }
      const key = card.roleCardKey;
      if (key && !(this.dismissedOptionalKeys || []).includes(key)) {
        this.dismissedOptionalKeys = this.dismissedOptionalKeys.concat(key);
      }
      if (
        this.optionalDraft &&
        key &&
        buildRoleCardKey(
          this.currentPhase.id,
          this.optionalDraft.playerIndex,
          this.optionalDraft.roleId,
        ) === key
      ) {
        this.optionalDraft = null;
      }
      this.optionalPickerOpen = false;
      this.$store.dispatch("battleLog/clearPreviewEffects");
    },
    isOptionalOnceUsed(playerIndex, roleId) {
      const id = String(roleId || "").toLowerCase();
      return this.entries.some((e) => {
        if (!e || e.source !== "roleCard" || !e.roleCardKey) return false;
        const parsed =
          parseSetupRoleCardKey(e.roleCardKey) ||
          parseRoleCardKey(e.roleCardKey);
        if (!parsed) return false;
        return (
          parsed.playerIndex === playerIndex &&
          String(parsed.roleId).toLowerCase() === id
        );
      });
    },
    selectOptionalCandidate(candidate) {
      if (!candidate) return;
      if (candidate.onceUsed && !candidate.recordedThisPhase) return;
      this.optionalPickerOpen = false;
      const roleCardKey = buildRoleCardKey(
        this.currentPhase.id,
        candidate.playerIndex,
        candidate.role.id,
      );
      this.dismissedOptionalKeys = (this.dismissedOptionalKeys || []).filter(
        (k) => k !== roleCardKey,
      );
      this.optionalDraft = {
        playerIndex: candidate.playerIndex,
        roleId: candidate.role.id,
        cardKey: candidate.cardKey || "",
      };
    },
    onOptionalRoleRecord(payload) {
      if (!payload) return;
      const parsed =
        parseSetupRoleCardKey(payload.roleCardKey) ||
        parseRoleCardKey(payload.roleCardKey);
      if (parsed != null) {
        const player = this.players[parsed.playerIndex];
        if (player && player.abilityLost) return;
      }
      this.$store.dispatch("battleLog/recordRoleAction", {
        ...payload,
        insertBeforeRoleCardKey: this.isNight
          ? this.insertBeforeRoleCardKey
          : MANUAL_END,
      });
      this.optionalDraft = null;
      this.optionalPickerOpen = false;
    },
    onSetupRoleRecord(payload) {
      if (!payload) return;
      const parsed = parseSetupRoleCardKey(payload.roleCardKey);
      if (parsed != null) {
        const player = this.players[parsed.playerIndex];
        if (player && player.abilityLost) return;
      }
      this.$store.dispatch("battleLog/recordRoleAction", payload);
    },
    openVoteForm() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.deadVoteFormOpen = false;
      this.optionalPickerOpen = false;
      this.optionalDraft = null;
      this.voteFormOpen = true;
    },
    closeVoteForm() {
      this.voteFormOpen = false;
    },
    openDeadVoteForm() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.optionalPickerOpen = false;
      this.optionalDraft = null;
      this.deadVotePrefill = null;
      this.deadVoteFormOpen = true;
    },
    closeDeadVoteForm() {
      this.deadVoteFormOpen = false;
      this.deadVotePrefill = null;
    },
    openExecutionForm() {
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
      this.optionalPickerOpen = false;
      this.optionalDraft = null;
      this.executionFormOpen = true;
    },
    closeExecutionForm() {
      this.executionFormOpen = false;
    },
    maybeAutoOpenExecutionForm() {
      if (this.isDusk && this.duskNominee) {
        this.openExecutionForm();
      }
    },
    isEditingManual(entry) {
      return entry && this.editingManualId === entry.id;
    },
    isEditingEntry(entry) {
      return entry && this.editingManualId === entry.id;
    },
    manualEditTokens(entry) {
      const tokens = entry && entry.formSnapshot && entry.formSnapshot.tokens;
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
    manualEditUseResultLine(entry) {
      const snap = entry && entry.formSnapshot;
      if (snap && snap.useResultLine != null) {
        return !!snap.useResultLine;
      }
      return !!(entry && entry.detail);
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
        ? this.nightCards.findIndex(
            (c) => c.roleCardKey === payload.roleCardKey,
          )
        : -1;
      const card = idx >= 0 ? this.nightCards[idx] : null;
      if (card && card.player && card.player.abilityLost) return;
      if (!card && payload) {
        const parsed = parseRoleCardKey(payload.roleCardKey);
        if (parsed != null) {
          const player = this.players[parsed.playerIndex];
          if (player && player.abilityLost) return;
        }
      }
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
    onExecutionRecord(payload) {
      if (payload.type === "noExecution") {
        this.$store.dispatch("battleLog/recordNoExecution", payload);
      } else {
        this.$store.dispatch("battleLog/recordExecution", payload);
      }
      this.executionFormOpen = false;
    },
    onDeleteManual(entryId) {
      if (!entryId) return;
      this.$store.dispatch("battleLog/cancelManualEntry", entryId);
      this.editingManualId = null;
      this.manualFormOpen = false;
      this.voteFormOpen = false;
      this.deadVoteFormOpen = false;
    },
    onDeleteRoleCard(roleCardKey) {
      if (!roleCardKey) return;
      this.$store.dispatch("battleLog/cancelRoleCard", roleCardKey);
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
    /**
     * Default card-equivalent order for a phase (matches 階段紀錄 layout).
     * Custom phaseOrders override when present.
     */
    orderedEntryIdsForPhase(phaseId, phaseEntries, phaseMeta) {
      const stored = this.phaseOrders && this.phaseOrders[phaseId];
      if (Array.isArray(stored) && stored.length) {
        return stored.slice();
      }
      return this.defaultCardOrderIds(phaseId, phaseEntries, phaseMeta);
    },
    defaultCardOrderIds(phaseId, phaseEntries, phaseMeta) {
      const entries = phaseEntries || [];
      const isNightPhase =
        (phaseMeta && phaseMeta.subPhase === "night") ||
        (phaseMeta && phaseMeta.type === "night") ||
        (this.currentPhase && this.currentPhase.id === phaseId && this.isNight);

      if (
        isNightPhase &&
        this.currentPhase &&
        this.currentPhase.id === phaseId
      ) {
        // Use live nightRows for the current night phase
        const ids = [];
        (this.nightRows || []).forEach((row) => {
          if (row.type === "manualRecorded" && row.entry) {
            ids.push(row.entry.id);
          } else if (
            row.type === "role" &&
            row.card &&
            row.card.recordedEntry
          ) {
            ids.push(row.card.recordedEntry.id);
          } else if (
            row.type === "optionalRole" &&
            row.card &&
            row.card.recordedEntry
          ) {
            ids.push(row.card.recordedEntry.id);
          }
        });
        // Include other phase entries not represented as cards (e.g. nightDeaths)
        entries.forEach((e) => {
          if (!ids.includes(e.id)) ids.push(e.id);
        });
        return ids;
      }

      if (isNightPhase) {
        // Past night: reconstruct from night order + insertBefore
        const nightOrderCards = [];
        this.players.forEach((player, playerIndex) => {
          const role = player.role;
          if (
            !roleHasNightAction(
              role,
              phaseMeta && phaseMeta.number === 0,
              this.overlay,
            )
          )
            return;
          const roleCardKey = buildRoleCardKey(phaseId, playerIndex, role.id);
          const order =
            phaseMeta && phaseMeta.number === 0
              ? role.firstNight || 0
              : role.otherNight || 0;
          nightOrderCards.push({ roleCardKey, order });
        });
        nightOrderCards.sort((a, b) => a.order - b.order);

        const manuals = entries.filter(
          (e) => e.source === "manual" && e.category === "manual",
        );
        const roleEntries = entries.filter((e) => e.source === "roleCard");
        const used = new Set();
        const ids = [];
        const pushBefore = (beforeKey) => {
          manuals
            .filter((m) => {
              const key =
                m.insertBeforeRoleCardKey == null
                  ? MANUAL_END
                  : m.insertBeforeRoleCardKey;
              return key === beforeKey && !used.has(m.id);
            })
            .forEach((m) => {
              ids.push(m.id);
              used.add(m.id);
            });
          roleEntries
            .filter((e) => {
              if (used.has(e.id)) return false;
              // Optional cards carry insertBefore; regular night roles do not
              if (e.insertBeforeRoleCardKey == null) return false;
              return e.insertBeforeRoleCardKey === beforeKey;
            })
            .forEach((e) => {
              ids.push(e.id);
              used.add(e.id);
            });
        };
        nightOrderCards.forEach((card) => {
          pushBefore(card.roleCardKey);
          const rec = roleEntries.find(
            (e) => e.roleCardKey === card.roleCardKey && !used.has(e.id),
          );
          if (rec) {
            ids.push(rec.id);
            used.add(rec.id);
          }
        });
        pushBefore(MANUAL_END);
        entries.forEach((e) => {
          if (!used.has(e.id)) ids.push(e.id);
        });
        return ids;
      }

      // Day / dusk / voting: entries array order (insertion), which matches cards
      return entries.map((e) => e.id);
    },
    movePreviewEntry(section, entry, direction) {
      if (!section || !entry) return;
      const fallbackOrder = section.entries.map((e) => e.id);
      this.$store.dispatch("battleLog/movePhaseEntry", {
        phaseId: section.key,
        entryId: entry.id,
        direction,
        fallbackOrder,
      });
    },
    entryMessage(entry) {
      return (
        formatEntryForDisplay(entry, { hideNickname: this.hideNickname }) ||
        formatLogMessage(entry, { hideNickname: this.hideNickname }) ||
        entry.message ||
        ""
      );
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
  margin: 0 0 10px;
  flex-shrink: 0;
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
  &.export-json {
    border-color: rgba(180, 200, 255, 0.45);
    color: #c8d8ff;
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
  width: 100%;
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  // Prefer parent (.panel-stack) height; fall back when used alone
  max-height: 100%;
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
  flex-wrap: wrap;
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
  flex: 1 1 auto;
  min-height: 36px;
  padding: 6px 8px;
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

.preview-toolbar {
  margin-bottom: 8px;
  text-align: left;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.hide-nickname-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  input {
    accent-color: #ffd699;
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
  li.preview-item {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    word-break: break-word;
  }
}

.preview-sort {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0;
  margin-top: 1px;
}

.sort-btn {
  border: none;
  background: transparent;
  color: rgba(255, 214, 153, 0.75);
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  font-size: 0.65rem;
  &:disabled {
    opacity: 0.25;
    cursor: default;
  }
  &:not(:disabled):hover {
    color: #ffd699;
  }
}

.preview-body {
  flex: 1;
  min-width: 0;
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
  white-space: pre-line;
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
  -webkit-overflow-scrolling: touch;
  flex: 1 1 auto;
  min-height: 0;
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
  &.add-execution-btn {
    border-color: rgba(255, 160, 80, 0.65);
    background: rgba(60, 30, 10, 0.55);
    color: #ffb366;
    &:hover {
      background: rgba(90, 45, 15, 0.7);
    }
  }
  &.add-optional-btn {
    border-color: rgba(120, 220, 160, 0.65);
    background: rgba(20, 45, 30, 0.55);
    color: #9eecc0;
    &:hover {
      background: rgba(30, 70, 45, 0.7);
    }
  }
}

.setup-block {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 200, 80, 0.45);
  background: rgba(40, 32, 10, 0.45);
  text-align: left;
}

.setup-title {
  margin: 0 0 6px;
  font-size: 0.85rem;
  color: #ffd699;
}

.setup-card-wrap {
  margin-top: 6px;
}

.day-ability-block {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(140, 190, 255, 0.35);
  background: rgba(20, 30, 50, 0.45);
}

.day-ability-title {
  margin: 0 0 4px;
  font-size: 0.82rem;
  color: #a8cfff;
}

.day-ability-hint {
  margin: 0 0 8px;
  font-size: 0.7rem;
  opacity: 0.7;
  line-height: 1.4;
}

.day-ability-card-wrap {
  margin-top: 6px;
}

.add-actions-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.optional-picker {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(120, 220, 160, 0.4);
  background: rgba(20, 40, 30, 0.55);
}

.optional-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  font-weight: bold;
  color: #9eecc0;
  margin-bottom: 4px;
}

.optional-hint {
  margin: 0 0 6px;
  font-size: 0.68rem;
  opacity: 0.7;
}

.optional-dismiss {
  border: none;
  background: transparent;
  color: #9eecc0;
  opacity: 0.8;
  cursor: pointer;
  font-size: 0.72rem;
  padding: 2px 4px;
  &:hover {
    opacity: 1;
  }
}

.optional-pick-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(120, 220, 160, 0.35);
  background: rgba(10, 30, 20, 0.65);
  color: #d8ffe8;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  &:hover:not(:disabled) {
    background: rgba(30, 70, 45, 0.75);
  }
  &:disabled,
  &.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.optional-once-tag {
  font-size: 0.65rem;
  opacity: 0.85;
  color: #ffd699;
  white-space: nowrap;
  margin-left: 8px;
}

.optional-card-wrap {
  margin-bottom: 8px;
}

.sortable-card {
  transition:
    outline-color 0.12s ease,
    opacity 0.12s ease;
  &.dragging {
    opacity: 0.55;
  }
  &.drag-over {
    outline: 2px solid rgba(70, 213, 255, 0.85);
    outline-offset: 2px;
    border-radius: 8px;
  }
}

.optional-card-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding: 0 2px;
}

.optional-card-tag {
  font-size: 0.68rem;
  font-weight: bold;
  color: #9eecc0;
  opacity: 0.9;
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
  &.scaffold {
    background: rgba(50, 35, 10, 0.45);
    border-color: rgba(255, 160, 80, 0.35);
    .manual-label {
      color: #ffb366;
    }
  }
  &.execution {
    background: rgba(60, 30, 10, 0.45);
    border-color: rgba(255, 160, 80, 0.35);
    .manual-label {
      color: #ffb366;
    }
  }
  &.alive {
    background: rgba(20, 40, 20, 0.45);
    border-color: rgba(120, 200, 120, 0.35);
    .manual-label {
      color: #a8e6a8;
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

.entry-card-rail {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.entry-card-head {
  padding-left: 22px;
  padding-right: 92px;
  min-height: 1.4rem;
  display: flex;
  align-items: center;
}

.manual-recorded-card .drag-handle {
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.75);
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  touch-action: none;
  user-select: none;
  filter: none;
  opacity: 1;
  &:active {
    cursor: grabbing;
    background: rgba(70, 213, 255, 0.25);
    border-color: rgba(70, 213, 255, 0.7);
    color: #e8fbff;
  }
}

.manual-recorded-card .record-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  filter: none;
  opacity: 1;
}

.manual-recorded-card .record-edit-btn {
  appearance: none;
  border: 1px solid rgba(255, 200, 80, 0.45);
  border-radius: 4px;
  background: rgba(120, 80, 0, 0.55);
  color: #ffe8b8;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 0.65rem;
  font-weight: bold;
  line-height: 1.3;
  white-space: nowrap;
  filter: none;
  opacity: 1;
  &:hover {
    background: rgba(150, 100, 0, 0.85);
    color: #fff4d6;
  }
}

.manual-recorded-card .record-delete-btn {
  position: static;
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
  flex-shrink: 0;
  filter: none;
  opacity: 1;
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 0, 0, 0.15);
  }
}

.manual-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #ffd699;
  margin: 0;
  line-height: 1.2;
  filter: none;
}

.manual-summary {
  font-size: 0.75rem;
  word-break: break-word;
  margin: 6px 0 0;
  padding-left: 22px;
  white-space: pre-line;
}

.manual-detail {
  display: block;
  font-size: 0.7rem;
  opacity: 0.7;
  margin: 4px 0 0;
  padding-left: 30px;
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
    white-space: pre-line;
  }
  .detail {
    display: block;
    opacity: 0.65;
    margin-left: 8px;
  }
}
</style>

<style lang="scss">
body.card-dragging {
  cursor: grabbing !important;
  user-select: none;
  touch-action: none;
}
</style>
