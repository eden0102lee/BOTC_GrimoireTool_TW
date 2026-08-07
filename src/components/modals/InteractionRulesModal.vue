<template>
  <Modal
    class="interaction-rules-modal"
    v-if="modals.interactionRules"
    @close="toggleModal('interactionRules')"
  >
    <div class="interaction-rules-body">
    <h3>{{ $t("interactionRules.title") }}</h3>
    <p class="subtitle">{{ $t("interactionRules.subtitle") }}</p>

    <div class="toolbar">
      <button type="button" class="button townsfolk" @click="saveOverlay">
        {{ $t("interactionRules.save") }}
      </button>
      <button type="button" class="button" @click="resetSelectedBuiltin" :disabled="!selectedRole">
        {{ $t("interactionRules.resetBuiltin") }}
      </button>
      <button type="button" class="button" @click="resetAllBuiltin">
        {{ $t("interactionRules.resetAll") }}
      </button>
      <button type="button" class="button" @click="exportRules">
        {{ $t("interactionRules.export") }}
      </button>
      <button type="button" class="button" @click="pickImport">
        {{ $t("interactionRules.import") }}
      </button>
      <input
        ref="importFile"
        type="file"
        accept=".json,application/json"
        hidden
        @change="onImportFile"
      />
    </div>

    <div class="editor-layout">
      <aside class="role-list">
        <input
          v-model="search"
          type="search"
          class="search"
          :placeholder="$t('interactionRules.search')"
        />
        <ul class="role-list-scroll">
          <li
            v-for="item in filteredRoles"
            :key="item.role.id"
            :class="{
              active: selectedRoleId === item.role.id,
              [item.status]: true,
            }"
            @click="selectRole(item.role)"
          >
            <div class="role-row">
              <span class="name">{{ item.role.name || item.role.id }}</span>
              <span class="badge">{{ statusLabel(item.status) }}</span>
            </div>
            <div v-if="item.cardLabels && item.cardLabels.length" class="card-chips">
              <span
                v-for="lab in item.cardLabels"
                :key="lab"
                class="card-chip"
              >{{ lab }}</span>
            </div>
          </li>
        </ul>
      </aside>

      <section class="rule-editor" v-if="editDoc && editRule">
        <div class="editor-head">
          <h4>{{ editDoc.name || editDoc.id }}</h4>
          <button
            type="button"
            class="toggle-chip"
            :class="{ on: !!editDoc.enabled }"
            :aria-pressed="editDoc.enabled ? 'true' : 'false'"
            @click="editDoc.enabled = !editDoc.enabled"
          >
            {{ $t("interactionRules.enabled") }}
          </button>
        </div>

        <div class="card-label-bar" v-if="editDoc.cards && editDoc.cards.length">
          <div class="card-label-tabs" role="tablist">
            <button
              v-for="card in editDoc.cards"
              :key="card.key"
              type="button"
              class="card-label-tab"
              role="tab"
              :class="{ active: activeCardKey === card.key }"
              :aria-selected="activeCardKey === card.key"
              @click="selectCard(card.key)"
            >
              {{ card.label || card.key }}
            </button>
          </div>
          <div class="card-label-actions">
            <button
              type="button"
              class="mini-btn"
              :title="$t('interactionRules.addCard')"
              @click="addCard"
            >
              +
            </button>
            <button
              type="button"
              class="mini-btn danger"
              :disabled="editDoc.cards.length <= 1"
              :title="$t('interactionRules.removeCard')"
              @click="removeActiveCard"
            >
              ×
            </button>
          </div>
        </div>

        <div class="section card-label-edit" v-if="editRule">
          <div class="field-grid">
            <label class="field">
              <span class="field-label">{{ $t("interactionRules.cardLabel") }}</span>
              <select v-model="editRule.label" @change="onCardLabelChange">
                <option
                  v-for="lab in cardLabelOptions"
                  :key="lab"
                  :value="lab"
                >
                  {{ lab }}
                </option>
              </select>
            </label>
            <div class="field">
              <span class="field-label">{{ $t("interactionRules.once") }}</span>
              <div class="toggle-chip-row">
                <button
                  type="button"
                  class="toggle-chip"
                  :class="{ on: !!editRule.once }"
                  :aria-pressed="editRule.once ? 'true' : 'false'"
                  @click="$set(editRule, 'once', !editRule.once)"
                >
                  {{ $t("interactionRules.once") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="selectedRoleAbility" class="role-ability">{{ selectedRoleAbility }}</p>

        <div class="section meta-section" v-if="editRule">
          <div class="section-head">
            <span>{{ $t("interactionRules.roleSettings") }}</span>
          </div>
          <div class="field-grid meta-fields">
            <label class="field">
              <span class="field-label">{{ $t("interactionRules.activation") }}</span>
              <select v-model="editRule.activation" @change="onActivationChange">
                <option value="">{{ $t("interactionRules.activationNight") }}</option>
                <option value="optional">{{ $t("interactionRules.activationOptional") }}</option>
                <option value="setup">{{ $t("interactionRules.activationSetup") }}</option>
                <option value="trigger">{{ $t("interactionRules.activationTrigger") }}</option>
              </select>
            </label>
            <div class="field field-toggles">
              <span class="field-label">{{ $t("interactionRules.whenNights") }}</span>
              <div class="toggle-chip-row">
                <button
                  type="button"
                  class="toggle-chip"
                  :class="{ on: hasNight('first') }"
                  :aria-pressed="hasNight('first') ? 'true' : 'false'"
                  @click="toggleNight('first')"
                >
                  {{ $t("interactionRules.nightFirst") }}
                </button>
                <button
                  type="button"
                  class="toggle-chip"
                  :class="{ on: hasNight('other') }"
                  :aria-pressed="hasNight('other') ? 'true' : 'false'"
                  @click="toggleNight('other')"
                >
                  {{ $t("interactionRules.nightOther") }}
                </button>
              </div>
            </div>
            <div class="field field-toggles">
              <span class="field-label">{{ $t("interactionRules.whenDays") }}</span>
              <div class="toggle-chip-row">
                <button
                  type="button"
                  class="toggle-chip"
                  :class="{ on: hasDay('first') }"
                  :aria-pressed="hasDay('first') ? 'true' : 'false'"
                  @click="toggleDay('first')"
                >
                  {{ $t("interactionRules.dayFirst") }}
                </button>
                <button
                  type="button"
                  class="toggle-chip"
                  :class="{ on: hasDay('other') }"
                  :aria-pressed="hasDay('other') ? 'true' : 'false'"
                  @click="toggleDay('other')"
                >
                  {{ $t("interactionRules.dayOther") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <span>{{ $t("interactionRules.inputs") }}</span>
            <button type="button" class="mini-btn" @click="addInput">+</button>
          </div>
          <div
            v-for="(input, idx) in editRule.inputs"
            :key="'in-' + idx"
            class="input-row"
          >
            <div class="field-grid input-fields">
              <label class="field">
                <span class="field-label">key</span>
                <input v-model="input.key" placeholder="key" />
              </label>
              <label class="field">
                <span class="field-label">{{ $t("interactionRules.inputTypeLabel") }}</span>
                <select v-model="input.type">
                  <option value="player">{{ inputTypeLabel("player") }}</option>
                  <option value="alivePlayer">{{ inputTypeLabel("alivePlayer") }}</option>
                  <option value="otherPlayer">{{ inputTypeLabel("otherPlayer") }}</option>
                  <option value="role">{{ inputTypeLabel("role") }}</option>
                  <option value="select">{{ inputTypeLabel("select") }}</option>
                  <option value="number">{{ inputTypeLabel("number") }}</option>
                  <option value="text">{{ inputTypeLabel("text") }}</option>
                </select>
              </label>
              <label class="field field-wide">
                <span class="field-label">{{ $t("interactionRules.label") }}</span>
                <input v-model="input.label" :placeholder="$t('interactionRules.label')" />
              </label>
              <label v-if="input.type === 'select'" class="field field-wide">
                <span class="field-label">{{ $t("interactionRules.selectOptions") }}</span>
                <input
                  :value="(input.options || []).join(', ')"
                  :placeholder="$t('interactionRules.selectOptionsHint')"
                  @input="setSelectOptions(input, $event.target.value)"
                />
              </label>
              <template v-if="isPlayerInputType(input.type) || input.type === 'role'">
                <label
                  v-if="isPlayerInputType(input.type)"
                  class="field"
                >
                  <span class="field-label">{{ $t("interactionRules.filterAlignment") }}</span>
                  <select
                    :value="input.alignment || ''"
                    @change="setInputAlignment(input, $event.target.value)"
                  >
                    <option value="">{{ $t("interactionRules.filterAny") }}</option>
                    <option
                      v-for="(lab, key) in alignmentLabels"
                      :key="key"
                      :value="key"
                    >
                      {{ lab }}
                    </option>
                  </select>
                </label>
                <div class="field field-toggles field-wide">
                  <span class="field-label">{{ $t("interactionRules.filterTeams") }}</span>
                  <div class="toggle-chip-row">
                    <button
                      v-for="(lab, key) in teamLabels"
                      :key="key"
                      type="button"
                      class="toggle-chip"
                      :class="{ on: hasInputTeam(input, key) }"
                      :aria-pressed="hasInputTeam(input, key) ? 'true' : 'false'"
                      @click="toggleInputTeam(input, key)"
                    >
                      {{ lab }}
                    </button>
                  </div>
                </div>
                <div v-if="input.type === 'role'" class="field field-toggles">
                  <span class="field-label">{{ $t("interactionRules.filterInPlay") }}</span>
                  <div class="toggle-chip-row">
                    <button
                      type="button"
                      class="toggle-chip"
                      :class="{ on: !!input.inPlay }"
                      :aria-pressed="input.inPlay ? 'true' : 'false'"
                      @click="$set(input, 'inPlay', !input.inPlay)"
                    >
                      {{ $t("interactionRules.filterInPlay") }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
            <div class="input-row-actions">
              <button
                type="button"
                class="toggle-chip"
                :class="{ on: !!input.required }"
                :aria-pressed="input.required ? 'true' : 'false'"
                @click="$set(input, 'required', !input.required)"
              >
                {{ $t("interactionRules.required") }}
              </button>
              <button type="button" class="mini-btn danger" @click="removeInput(idx)">×</button>
            </div>
          </div>
        </div>

        <div class="section grimoire-effects">
          <div class="section-head">
            <span>{{ $t("interactionRules.grimoireEffects") }}</span>
            <button type="button" class="mini-btn" @click="addEffect">+</button>
          </div>
          <p class="hint section-hint">
            {{ $t("interactionRules.grimoireEffectsHint") }}
            <a
              :href="reminderSheetUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="sheet-link"
            >{{ $t("interactionRules.reminderSheetLink") }}</a>
          </p>
          <div
            v-for="(effect, idx) in editRule.effects"
            :key="'ef-' + idx"
            class="grimoire-effect-row"
          >
            <div class="effect-summary">{{ formatEffectSummary(effect) }}</div>
            <div class="field-grid effect-fields">
              <label class="field">
                <span class="field-label">{{ $t("interactionRules.effectType") }}</span>
                <select v-model="effect.type" @change="onEffectTypeChange(effect)">
                  <option
                    v-for="action in grimoireActionTypes"
                    :key="action.type"
                    :value="action.type"
                  >
                    {{ action.label }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span class="field-label">{{ $t("interactionRules.pickTarget") }}</span>
                <select v-model="effect.targetFrom">
                  <option value="">{{ $t("interactionRules.pickTarget") }}</option>
                  <option value="actor">{{ $t("interactionRules.targetActor") }}</option>
                  <option
                    v-for="input in playerInputsForEffects"
                    :key="input.key"
                    :value="input.key"
                  >
                    {{ input.label || input.key }}
                  </option>
                </select>
              </label>
              <template v-if="effect.type === 'setAlignment'">
                <label class="field">
                  <span class="field-label">{{ $t("interactionRules.alignmentFixed") }}</span>
                  <select
                    :value="effect.alignment || ''"
                    @change="onEffectAlignmentChange(effect, $event.target.value)"
                  >
                    <option value="">{{ $t("interactionRules.alignmentFromPlayer") }}</option>
                    <option
                      v-for="(lab, key) in alignmentLabels"
                      :key="key"
                      :value="key"
                    >
                      {{ lab }}
                    </option>
                  </select>
                </label>
                <label v-if="!effect.alignment" class="field">
                  <span class="field-label">{{ $t("interactionRules.alignmentFrom") }}</span>
                  <select v-model="effect.alignmentFrom">
                    <option value="">—</option>
                    <option value="actor">{{ $t("interactionRules.targetActor") }}</option>
                    <option
                      v-for="input in playerInputsForEffects"
                      :key="'af-' + input.key"
                      :value="input.key"
                    >
                      {{ input.label || input.key }}
                    </option>
                  </select>
                </label>
              </template>
              <template v-if="effectNeedsReminder(effect.type)">
                <label class="field">
                  <span class="field-label">{{ $t("interactionRules.reminderRole") }}</span>
                  <select
                    v-model="effect.reminderRole"
                    @change="onReminderRoleChange(effect)"
                  >
                    <option :value="editDoc.id">
                      {{ editDoc.name || editDoc.id }}（{{ $t("interactionRules.thisRole") }}）
                    </option>
                    <optgroup :label="$t('interactionRules.otherRoleTokens')">
                      <option
                        v-for="r in otherScriptRolesWithReminders"
                        :key="r.id"
                        :value="r.id"
                        :title="r.reminders.join('、')"
                      >
                        {{ r.name }}
                      </option>
                    </optgroup>
                    <option :value="genericReminderRole">
                      {{ $t("interactionRules.genericToken") }}
                    </option>
                  </select>
                </label>
                <label class="field">
                  <span class="field-label">{{ $t("interactionRules.pickReminder") }}</span>
                  <select
                    v-model="effect.reminderName"
                    @change="onReminderNameChange(effect)"
                  >
                    <option value="">{{ $t("interactionRules.pickReminder") }}</option>
                    <option
                      v-for="name in reminderOptionsForEffect(effect)"
                      :key="effect.reminderRole + '-' + name"
                      :value="name"
                    >
                      {{ name }}
                    </option>
                  </select>
                </label>
              </template>
              <label class="field field-wide">
                <span class="field-label">{{ $t("interactionRules.cardToggleLabel") }}</span>
                <input
                  v-model="effect.label"
                  :placeholder="$t('interactionRules.cardToggleLabel')"
                />
              </label>
              <label v-if="bindToOptions(idx).length" class="field">
                <span class="field-label">{{ $t("interactionRules.bindToHint") }}</span>
                <select
                  v-model="effect.bindTo"
                  :title="$t('interactionRules.bindToHint')"
                >
                  <option value="">{{ $t("interactionRules.bindToNone") }}</option>
                  <option
                    v-for="opt in bindToOptions(idx)"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </label>
              <div class="field field-toggles" v-if="!effect.bindTo">
                <div class="toggle-chip-row">
                  <button
                    type="button"
                    class="toggle-chip"
                    :class="{ on: !!effect.optional }"
                    :aria-pressed="effect.optional ? 'true' : 'false'"
                    @click="$set(effect, 'optional', !effect.optional)"
                  >
                    {{ $t("interactionRules.optionalToggle") }}
                  </button>
                  <button
                    v-if="effect.optional"
                    type="button"
                    class="toggle-chip"
                    :class="{ on: effect.defaultOn !== false }"
                    :aria-pressed="effect.defaultOn !== false ? 'true' : 'false'"
                    @click="$set(effect, 'defaultOn', effect.defaultOn === false)"
                  >
                    {{ $t("interactionRules.defaultOn") }}
                  </button>
                </div>
              </div>
            </div>
            <div class="effect-row-actions">
              <button type="button" class="mini-btn danger" @click="removeEffect(idx)">×</button>
            </div>
          </div>
        </div>

        <div class="section">
          <label>{{ $t("interactionRules.sentenceAction") }}</label>
          <input v-model="editRule.sentence.action" />
          <label>{{ $t("interactionRules.sentenceTemplate") }}</label>
          <textarea v-model="editRule.sentence.template" rows="3" />
          <p class="hint">{{ $t("interactionRules.templateHint") }}</p>
        </div>

        <div class="section">
          <label>{{ $t("interactionRules.notes") }}</label>
          <textarea v-model="editRule.notes" rows="2" />
        </div>

        <div class="editor-actions">
          <button
            v-if="selectedStatus === 'draft-available'"
            type="button"
            class="button"
            @click="createDraft"
          >
            {{ $t("interactionRules.createDraft") }}
          </button>
          <button type="button" class="button townsfolk" @click="applyEdit">
            {{ $t("interactionRules.applyEdit") }}
          </button>
        </div>
      </section>

      <section class="rule-editor empty" v-else-if="selectedRole">
        <p>{{ $t("interactionRules.noRuleYet") }}</p>
        <button type="button" class="button townsfolk" @click="createBlankRule">
          {{ $t("interactionRules.createBlank") }}
        </button>
        <button
          v-if="selectedStatus === 'draft-available'"
          type="button"
          class="button"
          @click="createDraft"
        >
          {{ $t("interactionRules.createDraft") }}
        </button>
      </section>

      <aside class="preview-panel">
        <h4>{{ $t("interactionRules.preview") }}</h4>
        <div v-if="editRule" class="preview-form">
          <div v-if="editRule.label" class="preview-card-label">
            LABEL · {{ editRule.label }}
          </div>
          <label
            v-for="input in editRule.inputs"
            :key="'pv-' + input.key"
            class="preview-field"
          >
            <span>{{ input.label || input.key }}</span>
            <select
              v-if="isPlayerInputType(input.type)"
              v-model="previewForm[input.key]"
            >
              <option value="">—</option>
              <option
                v-for="opt in previewPlayersForInput(input)"
                :key="opt.index"
                :value="playerLabel(opt.player, opt.index)"
              >
                {{ playerLabel(opt.player, opt.index) }}
              </option>
            </select>
            <select
              v-else-if="input.type === 'role'"
              v-model="previewForm[input.key]"
            >
              <option value="">—</option>
              <option
                v-for="r in previewRolesForInput(input)"
                :key="r.id"
                :value="r.name || r.id"
              >
                {{ r.name || r.id }}
              </option>
            </select>
            <select
              v-else-if="input.type === 'select'"
              v-model="previewForm[input.key]"
            >
              <option value="">—</option>
              <option v-for="opt in input.options || []" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <input v-else v-model="previewForm[input.key]" />
          </label>

          <div v-if="editRule.effects && editRule.effects.length" class="effect-toggles">
            <p class="preview-label">{{ $t("interactionRules.grimoireEffects") }}</p>
            <div class="toggle-chip-row">
              <button
                v-for="item in previewVisibleEffects"
                :key="'pt-' + item.idx"
                type="button"
                class="toggle-chip"
                :class="{ on: !!previewToggles[item.key] }"
                :aria-pressed="previewToggles[item.key] ? 'true' : 'false'"
                :title="item.label"
                @click="$set(previewToggles, item.key, !previewToggles[item.key])"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="preview-sentence">
            <span class="preview-label">{{ $t("interactionRules.sentencePreview") }}</span>
            <p>{{ previewSentence || "—" }}</p>
          </div>
          <div class="preview-effects">
            <span class="preview-label">{{ $t("interactionRules.effectsPreview") }}</span>
            <ul>
              <li v-for="(line, i) in previewEffectLines" :key="i">{{ line }}</li>
              <li v-if="!previewEffectLines.length" class="empty">
                {{ $t("interactionRules.noEffects") }}
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="empty-hint">{{ $t("interactionRules.selectRole") }}</p>
      </aside>
    </div>
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState, mapGetters } from "vuex";
import Modal from "./Modal";
import {
  effectsFromRule,
  describeEffects,
  coverageStatus,
  normalizeRule,
  normalizeCard,
  getRoleDocument,
  slugifyCardKey,
  inferCardLabel,
  normalizeCardLabel,
  listRoleCards,
  CARD_LABELS,
  activationForLabel,
} from "../../store/roleInteractionEngine";
import {
  getRoleInputConfig,
  formatPlayerRoleLabel,
} from "../../store/roleInputConfig";
import { buildNaturalRoleMessage } from "../../store/battleLogFormat";
import {
  COMMUNITY_TRANSLATIONS_SHEET_URL,
  GENERIC_REMINDER_ROLE,
  reminderNamesForRole,
  rolesWithReminders,
} from "../../store/roleReminderCatalog";
import {
  INPUT_TYPE_LABELS,
  GRIMOIRE_ACTION_TYPES,
  isPlayerInputType,
  isEffectToggleVisible,
  grimoireActionNeedsReminder,
  formatGrimoireEffectSpec,
  filterPlayersForInput,
  filterRolesForInput,
  TEAM_LABELS,
  ALIGNMENT_LABELS,
} from "../../store/roleInteractionTypes";

export default {
  name: "InteractionRulesModal",
  components: { Modal },
  data() {
    return {
      search: "",
      selectedRoleId: null,
      editDoc: null,
      activeCardKey: null,
      previewForm: {},
      previewToggles: {},
      grimoireActionTypes: GRIMOIRE_ACTION_TYPES,
      reminderSheetUrl: COMMUNITY_TRANSLATIONS_SHEET_URL,
      genericReminderRole: GENERIC_REMINDER_ROLE,
      teamLabels: TEAM_LABELS,
      alignmentLabels: ALIGNMENT_LABELS,
    };
  },
  computed: {
    ...mapState(["modals", "roles"]),
    ...mapState("interactionRules", ["overlay", "editorDirty"]),
    ...mapState("players", { boardPlayers: "players" }),
    ...mapGetters("interactionRules", ["ruleById"]),
    editRule() {
      if (!this.editDoc || !this.editDoc.cards || !this.activeCardKey) return null;
      return (
        this.editDoc.cards.find((c) => c.key === this.activeCardKey) || null
      );
    },
    scriptRoles() {
      return [...this.roles.values()];
    },
    roleItems() {
      return this.scriptRoles.map((role) => {
        const cards = listRoleCards(role.id, this.overlay);
        const labels = cards.map((c) => c.cardLabel).filter(Boolean);
        const showChips =
          labels.length > 1 ||
          labels.some((lab) => normalizeCardLabel(lab) === "setup");
        return {
          role,
          status: coverageStatus(role, this.overlay, getRoleInputConfig),
          cardLabels: showChips ? labels : [],
        };
      });
    },
    cardLabelOptions() {
      const current = this.editRule && this.editRule.label;
      const list = CARD_LABELS.slice();
      if (current && !list.includes(current)) list.unshift(current);
      return list;
    },
    filteredRoles() {
      const q = this.search.trim().toLowerCase();
      let list = this.roleItems;
      if (q) {
        list = list.filter(
          (item) =>
            (item.role.name || "").toLowerCase().includes(q) ||
            (item.role.id || "").toLowerCase().includes(q),
        );
      }
      return list.sort((a, b) =>
        (a.role.name || a.role.id).localeCompare(b.role.name || b.role.id, "zh"),
      );
    },
    selectedRole() {
      if (!this.selectedRoleId) return null;
      return this.roles.get(this.selectedRoleId) || null;
    },
    selectedStatus() {
      if (!this.selectedRole) return "fallback";
      return coverageStatus(this.selectedRole, this.overlay, getRoleInputConfig);
    },
    selectedRoleAbility() {
      if (!this.selectedRole) return "";
      return this.selectedRole.ability || "";
    },
    previewPlayers() {
      if (this.boardPlayers && this.boardPlayers.length) {
        return this.boardPlayers;
      }
      return [
        { name: "玩家A", role: { name: "範例角色" } },
        { name: "玩家B", role: { name: "範例角色" }, isDead: true },
        { name: "玩家C", role: { name: "範例角色" } },
      ];
    },
    previewActorIndex() {
      if (!this.selectedRoleId || !this.boardPlayers || !this.boardPlayers.length) {
        return -1;
      }
      const idx = this.boardPlayers.findIndex(
        (p) => p.role && p.role.id === this.selectedRoleId,
      );
      return idx >= 0 ? idx : -1;
    },
    previewRunnableRule() {
      if (!this.editDoc || !this.editRule) return null;
      return {
        id: this.editDoc.id,
        name: this.editDoc.name,
        enabled: this.editDoc.enabled !== false && this.editRule.enabled !== false,
        cardKey: this.editRule.key,
        cardLabel: this.editRule.label,
        activation: this.editRule.activation || null,
        once: !!this.editRule.once,
        when: this.editRule.when,
        inputs: this.editRule.inputs,
        sentence: this.editRule.sentence,
        effects: this.editRule.effects,
        notes: this.editRule.notes,
      };
    },
    previewSentence() {
      const rule = this.previewRunnableRule;
      if (!rule) return "";
      const effects = effectsFromRule(
        rule,
        this.previewForm,
        this.previewPlayers,
        this.previewToggles,
        this.roles,
        this.previewActorIndex,
      );
      return buildNaturalRoleMessage(rule, {
        players: this.previewPlayers,
        actorIndex: this.previewActorIndex,
        formData: this.previewForm,
        effects,
      });
    },
    previewEffectLines() {
      const rule = this.previewRunnableRule;
      if (!rule) return [];
      const effects = effectsFromRule(
        rule,
        this.previewForm,
        this.previewPlayers,
        this.previewToggles,
        this.roles,
        this.previewActorIndex,
      );
      return describeEffects(effects, this.previewPlayers);
    },
    playerInputsForEffects() {
      if (!this.editRule || !this.editRule.inputs) return [];
      return this.editRule.inputs.filter((input) => isPlayerInputType(input.type));
    },
    roleReminderNames() {
      return reminderNamesForRole(
        this.editDoc ? this.editDoc.id : null,
        this.roles,
        { includeGeneric: true },
      );
    },
    scriptRolesWithReminders() {
      return rolesWithReminders(this.roles);
    },
    otherScriptRolesWithReminders() {
      if (!this.editDoc) return this.scriptRolesWithReminders;
      return this.scriptRolesWithReminders.filter(
        (r) => r.id !== this.editDoc.id,
      );
    },
    previewVisibleEffects() {
      if (!this.editRule || !this.editRule.effects) return [];
      return this.editRule.effects
        .map((effect, idx) => ({
          effect,
          idx,
          key: this.effectToggleKey(effect, idx),
          label:
            effect.label ||
            formatGrimoireEffectSpec(effect, this.editRule.inputs),
        }))
        .filter((item) => isEffectToggleVisible(item.effect));
    },
  },
  watch: {
    editRule: {
      deep: true,
      handler(rule) {
        if (!rule) return;
        this.syncPreviewForm(rule);
      },
    },
    "modals.interactionRules"(open) {
      if (open && this.selectedRoleId) {
        this.loadRuleForSelected();
      }
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    isPlayerInputType,
    effectNeedsReminder: grimoireActionNeedsReminder,
    formatEffectSummary(effect) {
      if (!this.editRule) return "";
      return (
        effect.label ||
        formatGrimoireEffectSpec(effect, this.editRule.inputs)
      );
    },
    hasNight(night) {
      if (!this.editRule || !this.editRule.when || !this.editRule.when.nights) {
        return false;
      }
      return this.editRule.when.nights.includes(night);
    },
    toggleNight(night) {
      this.ensureWhen();
      const nights = this.editRule.when.nights.slice();
      const idx = nights.indexOf(night);
      if (idx < 0) nights.push(night);
      else nights.splice(idx, 1);
      this.$set(this.editRule.when, "nights", nights);
    },
    hasDay(day) {
      if (!this.editRule || !this.editRule.when || !this.editRule.when.days) {
        return false;
      }
      return this.editRule.when.days.includes(day);
    },
    toggleDay(day) {
      this.ensureWhen();
      if (!Array.isArray(this.editRule.when.days)) {
        this.$set(this.editRule.when, "days", []);
      }
      const days = this.editRule.when.days.slice();
      const idx = days.indexOf(day);
      if (idx < 0) days.push(day);
      else days.splice(idx, 1);
      this.$set(this.editRule.when, "days", days);
    },
    ensureWhen() {
      if (!this.editRule.when || typeof this.editRule.when !== "object") {
        this.$set(this.editRule, "when", { nights: [], days: [] });
      }
      if (!Array.isArray(this.editRule.when.nights)) {
        this.$set(this.editRule.when, "nights", []);
      }
      if (!Array.isArray(this.editRule.when.days)) {
        this.$set(this.editRule.when, "days", []);
      }
    },
    setSelectOptions(input, raw) {
      const options = String(raw || "")
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      this.$set(input, "options", options);
    },
    bindToOptions(currentIdx) {
      if (!this.editRule || !this.editRule.effects) return [];
      return this.editRule.effects
        .map((effect, idx) => ({
          effect,
          idx,
          value: effect.id || `effect-${idx}`,
          label:
            effect.label ||
            formatGrimoireEffectSpec(effect, this.editRule.inputs),
        }))
        .filter(
          (item) =>
            item.idx !== currentIdx &&
            item.effect.optional &&
            !item.effect.bindTo,
        );
    },
    onReminderRoleChange(effect) {
      const names = this.reminderOptionsForEffect(effect);
      if (effect.reminderName && !names.includes(effect.reminderName)) {
        effect.reminderName = names[0] || "";
      }
      this.refreshEffectLabel(effect);
    },
    onReminderNameChange(effect) {
      this.refreshEffectLabel(effect);
    },
    reminderOptionsForEffect(effect) {
      const roleId = effect.reminderRole || (this.editDoc && this.editDoc.id);
      return reminderNamesForRole(roleId, this.roles, {
        includeGeneric: roleId === GENERIC_REMINDER_ROLE,
      });
    },
    refreshEffectLabel(effect) {
      if (!effect.label && this.editRule) {
        effect.label = formatGrimoireEffectSpec(effect, this.editRule.inputs);
      }
    },
    onEffectTypeChange(effect) {
      if (this.effectNeedsReminder(effect.type)) {
        if (!effect.reminderName) effect.reminderName = "";
        if (!effect.reminderRole) {
          effect.reminderRole = this.editDoc
            ? this.editDoc.id
            : GENERIC_REMINDER_ROLE;
        }
      } else {
        effect.reminderName = "";
      }
      if (effect.type !== "setAlignment") {
        this.$delete(effect, "alignment");
        this.$delete(effect, "alignmentFrom");
      } else if (!effect.alignment && !effect.alignmentFrom) {
        this.$set(effect, "alignmentFrom", "target");
      }
      if (!effect.label) {
        effect.label = formatGrimoireEffectSpec(
          effect,
          this.editRule ? this.editRule.inputs : [],
        );
      }
    },
    inputTypeLabel(type) {
      const key = INPUT_TYPE_LABELS[type];
      if (key) return `${type}（${key}）`;
      return type;
    },
    previewPlayersForInput(input) {
      return filterPlayersForInput(
        this.previewPlayers,
        input,
        this.previewActorIndex,
        this.playerLabel,
      );
    },
    previewRolesForInput(input) {
      return filterRolesForInput(this.scriptRoles, this.previewPlayers, input);
    },
    setInputAlignment(input, value) {
      if (!value) {
        this.$delete(input, "alignment");
      } else {
        this.$set(input, "alignment", value);
      }
    },
    hasInputTeam(input, team) {
      return Array.isArray(input.teams) && input.teams.includes(team);
    },
    toggleInputTeam(input, team) {
      const cur = Array.isArray(input.teams) ? input.teams.slice() : [];
      const i = cur.indexOf(team);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(team);
      if (cur.length) this.$set(input, "teams", cur);
      else this.$delete(input, "teams");
    },
    onEffectAlignmentChange(effect, value) {
      if (!value) {
        this.$delete(effect, "alignment");
      } else {
        this.$set(effect, "alignment", value);
        this.$delete(effect, "alignmentFrom");
      }
      if (!effect.label || String(effect.label).includes("陣營")) {
        effect.label = formatGrimoireEffectSpec(
          effect,
          this.editRule ? this.editRule.inputs : [],
        );
      }
    },
    playerLabel(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    statusLabel(status) {
      return this.$t(`interactionRules.status.${status}`);
    },
    effectToggleKey(effect, idx) {
      return effect.id || `effect-${idx}`;
    },
    selectRole(role) {
      this.selectedRoleId = role.id;
      this.loadRuleForSelected();
    },
    selectCard(key) {
      this.activeCardKey = key;
      if (this.editRule) this.syncPreviewForm(this.editRule);
    },
    onCardLabelChange() {
      if (!this.editRule) return;
      const label = normalizeCardLabel(inferCardLabel(this.editRule));
      this.editRule.label = label;
      this.ensureWhen();
      this.editRule.activation = activationForLabel(label);
      if (label === "firstDay") {
        this.$set(this.editRule.when, "days", ["first"]);
        this.$set(this.editRule.when, "nights", []);
      }
      if (label === "everyDay") {
        this.$set(this.editRule.when, "days", ["first", "other"]);
        this.$set(this.editRule.when, "nights", []);
      }
      if (label === "firstNight") {
        this.$set(this.editRule.when, "nights", ["first"]);
        this.$set(this.editRule.when, "days", []);
      }
      if (label === "otherNight") {
        this.$set(this.editRule.when, "nights", ["other"]);
        this.$set(this.editRule.when, "days", []);
      }
      if (label === "everyNight") {
        this.$set(this.editRule.when, "nights", ["first", "other"]);
        this.$set(this.editRule.when, "days", []);
      }
      if (
        label === "setup" ||
        label === "optional" ||
        label === "trigger" ||
        label === "nominate" ||
        label === "death" ||
        label === "passive"
      ) {
        this.$set(this.editRule.when, "nights", []);
        this.$set(this.editRule.when, "days", []);
      }
      const nextKey = slugifyCardKey(
        label,
        this.editDoc.cards.indexOf(this.editRule),
      );
      const clash = this.editDoc.cards.some(
        (c) => c !== this.editRule && c.key === nextKey,
      );
      if (!clash) {
        this.editRule.key = nextKey;
        this.activeCardKey = nextKey;
      }
    },
    onActivationChange() {
      if (!this.editRule) return;
      // Prefer LABEL as source of truth; activation edits remapped via label when empty.
      if (!this.editRule.label) {
        this.editRule.label = inferCardLabel(this.editRule);
        this.onCardLabelChange();
      }
    },
    addCard() {
      if (!this.editDoc) return;
      const n = this.editDoc.cards.length + 1;
      const label = `card${n}`;
      const card = normalizeCard(
        {
          key: slugifyCardKey(label, n),
          label,
          enabled: true,
          activation: "",
          once: false,
          when: { nights: ["first", "other"], days: [] },
          inputs: [{ key: "target", type: "player", label: "目標對象" }],
          sentence: {
            action: "選擇",
            template: "{actor} → {action} → 選擇 {target}",
          },
          effects: [],
          notes: "",
        },
        n,
      );
      if (card.activation == null) card.activation = "";
      this.editDoc.cards.push(card);
      this.activeCardKey = card.key;
    },
    removeActiveCard() {
      if (!this.editDoc || !this.editDoc.cards || this.editDoc.cards.length <= 1) {
        return;
      }
      const idx = this.editDoc.cards.findIndex((c) => c.key === this.activeCardKey);
      if (idx < 0) return;
      this.editDoc.cards.splice(idx, 1);
      const next = this.editDoc.cards[Math.max(0, idx - 1)];
      this.activeCardKey = next ? next.key : null;
    },
    prepareCardForEdit(card) {
      if (!card) return;
      if (card.activation == null) card.activation = "";
      if (card.once == null) card.once = false;
      if (!card.when) card.when = { nights: [], days: [] };
      if (!Array.isArray(card.when.nights)) card.when.nights = [];
      if (!Array.isArray(card.when.days)) card.when.days = [];
      if (!card.sentence) {
        card.sentence = { action: "選擇", template: "{actor} → {action}" };
      }
      if (card.label) card.label = normalizeCardLabel(card.label) || card.label;
    },
    loadRuleForSelected() {
      const role = this.selectedRole;
      if (!role) {
        this.editDoc = null;
        this.activeCardKey = null;
        return;
      }
      const existing =
        getRoleDocument(role.id, this.overlay) || this.ruleById(role.id);
      if (existing) {
        this.editDoc = JSON.parse(JSON.stringify(normalizeRule(existing)));
      } else {
        this.editDoc = null;
        this.activeCardKey = null;
        return;
      }
      (this.editDoc.cards || []).forEach((card) => this.prepareCardForEdit(card));
      const preferred =
        (this.editDoc.cards || []).find((c) => c.key === this.activeCardKey) ||
        (this.editDoc.cards || []).find((c) => c.activation !== "setup") ||
        (this.editDoc.cards || [])[0];
      this.activeCardKey = preferred ? preferred.key : null;
      if (this.editRule) this.syncPreviewForm(this.editRule);
    },
    syncPreviewForm(rule) {
      const next = {};
      const toggles = {};
      (rule.inputs || []).forEach((input) => {
        next[input.key] = this.previewForm[input.key] || "";
      });
      (rule.effects || []).forEach((effect, idx) => {
        if (!isEffectToggleVisible(effect)) return;
        const key = this.effectToggleKey(effect, idx);
        toggles[key] =
          this.previewToggles[key] !== undefined
            ? this.previewToggles[key]
            : effect.defaultOn !== false;
      });
      this.previewForm = next;
      this.previewToggles = toggles;
    },
    createBlankRule() {
      const role = this.selectedRole;
      if (!role) return;
      this.editDoc = normalizeRule({
        id: role.id,
        name: role.name || role.id,
        enabled: true,
        cards: [
          {
            key: "default",
            label: "default",
            inputs: [{ key: "target", type: "player", label: "目標對象" }],
            sentence: {
              action: "選擇",
              template: "{actor} → {action} → 選擇 {target}",
            },
            effects: [],
            notes: "",
          },
        ],
      });
      this.prepareCardForEdit(this.editDoc.cards[0]);
      this.activeCardKey = this.editDoc.cards[0].key;
    },
    async createDraft() {
      const role = this.selectedRole;
      if (!role) return;
      const draft = await this.$store.dispatch(
        "interactionRules/createDraftFromLegacy",
        role,
      );
      if (draft) {
        this.editDoc = JSON.parse(JSON.stringify(normalizeRule(draft)));
        (this.editDoc.cards || []).forEach((card) => this.prepareCardForEdit(card));
        this.activeCardKey = this.editDoc.cards[0] ? this.editDoc.cards[0].key : null;
      }
    },
    addInput() {
      if (!this.editRule) return;
      this.editRule.inputs.push({
        key: `p${this.editRule.inputs.length + 1}`,
        type: "player",
        label: "玩家",
        required: false,
      });
    },
    removeInput(idx) {
      this.editRule.inputs.splice(idx, 1);
    },
    addEffect() {
      if (!this.editRule || !this.editDoc) return;
      const firstTarget =
        this.playerInputsForEffects[0] &&
        this.playerInputsForEffects[0].key;
      const spec = {
        type: "addReminder",
        targetFrom: firstTarget || "target",
        reminderName: "",
        reminderRole: this.editDoc.id,
        optional: false,
        defaultOn: true,
        label: "",
      };
      spec.label = formatGrimoireEffectSpec(spec, this.editRule.inputs);
      this.editRule.effects.push(spec);
    },
    removeEffect(idx) {
      this.editRule.effects.splice(idx, 1);
    },
    applyEdit() {
      if (!this.editDoc) return;
      const payload = JSON.parse(JSON.stringify(this.editDoc));
      (payload.cards || []).forEach((card) => {
        if (!card.activation) card.activation = null;
      });
      this.$store.commit("interactionRules/upsertRule", payload);
      this.$store.dispatch("interactionRules/saveOverlay");
      this.loadRuleForSelected();
    },
    saveOverlay() {
      this.$store.dispatch("interactionRules/saveOverlay");
    },
    resetSelectedBuiltin() {
      if (!this.selectedRoleId) return;
      this.$store.commit("interactionRules/resetRuleToBuiltin", this.selectedRoleId);
      this.$store.dispatch("interactionRules/saveOverlay");
      this.loadRuleForSelected();
    },
    resetAllBuiltin() {
      if (!window.confirm(this.$t("interactionRules.confirmResetAll"))) return;
      this.$store.dispatch("interactionRules/clearOverlay");
      this.loadRuleForSelected();
    },
    exportRules() {
      const text = this.$store.dispatch("interactionRules/exportOverlay");
      Promise.resolve(text).then((payload) => {
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "role-interaction-rules.json";
        a.click();
        URL.revokeObjectURL(url);
      });
    },
    pickImport() {
      const input = this.$refs.importFile;
      if (input) input.click();
    },
    onImportFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          this.$store.dispatch("interactionRules/importOverlay", reader.result);
          this.loadRuleForSelected();
        } catch (e) {
          window.alert(this.$t("interactionRules.importFailed"));
        }
        event.target.value = "";
      };
      reader.readAsText(file);
    },
  },
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";

.interaction-rules-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  max-height: calc(94dvh - 80px);
}

.subtitle {
  font-size: 0.9rem;
  opacity: 0.75;
  margin: 0 0 12px;
  line-height: 1.45;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;

  .button {
    font-size: 0.82rem;
    padding: 6px 10px;
    white-space: nowrap;
  }
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr) minmax(300px, 340px);
  gap: 16px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.role-list {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .search {
    flex: 0 0 auto;
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.55);
    color: white;
    font-size: 0.85rem;
    position: relative;
    z-index: 1;
  }

  .role-list-scroll {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    justify-content: flex-start;
    align-content: flex-start;
    line-height: normal;
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1 1 auto;
    min-height: 0;
  }

  li {
    flex: 0 0 auto;
    width: 100%;
    box-sizing: border-box;
    padding: 5px 8px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    gap: 3px;

    &:hover,
    &.active {
      background: rgba(255, 255, 255, 0.08);
    }

    &.complete .badge {
      color: lighten($townsfolk, 10%);
    }
    &.inputs-only .badge {
      color: lighten($outsider, 10%);
    }
    &.draft-available .badge {
      color: lighten($minion, 15%);
    }
    &.fallback .badge,
    &.passive .badge {
      opacity: 0.55;
    }
  }

  .role-row {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
  }

  .name {
    font-size: 0.84rem;
    line-height: 1.25;
    word-break: break-word;
    min-width: 0;
    flex: 1 1 auto;
  }

  .badge {
    font-size: 0.68rem;
    opacity: 0.85;
    line-height: 1.2;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .card-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }

  .card-chip {
    font-size: 0.62rem;
    line-height: 1.2;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid rgba(255, 214, 153, 0.35);
    color: #ffd699;
    opacity: 0.9;
  }
}

.rule-editor {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  overflow-y: auto;
  text-align: left;
  min-height: 0;
  min-width: 0;

  &.empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 10px;
  }
}

.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.3;
    word-break: break-word;
  }
}

.card-label-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.card-label-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
}

.card-label-tab {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.72rem;
  line-height: 1.3;
  cursor: pointer;
  letter-spacing: 0.02em;

  &.active {
    background: rgba(255, 214, 153, 0.18);
    border-color: rgba(255, 214, 153, 0.55);
    color: #ffd699;
  }
}

.card-label-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.card-label-edit {
  margin-bottom: 8px;

  .field {
    margin: 0;
  }
}

.preview-card-label {
  font-size: 0.72rem;
  color: #ffd699;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
}

.role-ability {
  margin: 0 0 10px;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 0.76rem;
  line-height: 1.4;
  opacity: 0.88;
}

.section {
  margin-bottom: 12px;

  > label {
    display: block;
    font-size: 0.8rem;
    margin-bottom: 4px;
    opacity: 0.85;
  }

  input,
  select,
  textarea {
    width: 100%;
    margin-bottom: 6px;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: 0.85rem;
    line-height: 1.35;
    box-sizing: border-box;
  }

  textarea {
    resize: vertical;
    min-height: 52px;
  }
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  font-weight: bold;
  margin-bottom: 6px;
  gap: 8px;
}

.section-hint {
  margin: 0 0 8px;
  font-size: 0.74rem;
  opacity: 0.75;
  line-height: 1.4;

  .sheet-link {
    color: #8fd4ff;
    margin-left: 4px;
    word-break: break-all;
  }
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

  &.field-wide {
    grid-column: 1 / -1;
  }

  &.field-toggles {
    grid-column: 1 / -1;
  }

  input,
  select {
    width: 100%;
    margin-bottom: 0;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: 0.85rem;
    box-sizing: border-box;
  }
}

.meta-fields .field-toggles .field-label {
  margin-bottom: 2px;
}

.field-label {
  font-size: 0.7rem;
  opacity: 0.72;
  line-height: 1.25;
}

.input-row,
.grimoire-effect-row {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.input-row-actions,
.effect-row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.grimoire-effects .grimoire-effect-row {
  border-color: rgba(255, 214, 153, 0.22);
}

.effect-summary {
  font-size: 0.8rem;
  color: #ffd699;
  margin-bottom: 6px;
  line-height: 1.35;
  word-break: break-word;
}

.effect-fields {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mini-btn {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;

  &.danger {
    color: #ffb0b0;
  }
}

.hint {
  font-size: 0.74rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.4;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preview-panel {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  overflow-y: auto;
  text-align: left;
  min-height: 0;
  min-width: 0;

  h4 {
    margin: 0 0 10px;
    font-size: 0.95rem;
  }
}

.preview-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 0.82rem;

  > span {
    line-height: 1.35;
    word-break: break-word;
  }

  select,
  input {
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: 0.85rem;
    width: 100%;
    box-sizing: border-box;
  }
}

.effect-toggles {
  margin-top: 4px;
}

.toggle-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toggle-chip {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  line-height: 1.25;
  cursor: pointer;
  user-select: none;
  max-width: 100%;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &.on {
    background: rgba(70, 213, 255, 0.22);
    border-color: rgba(70, 213, 255, 0.75);
    color: #e8fbff;
  }
}

.preview-label {
  display: block;
  font-size: 0.76rem;
  opacity: 0.72;
  margin-bottom: 4px;
}

.preview-sentence p {
  margin: 4px 0 12px;
  font-size: 0.85rem;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-line;
}

.preview-effects ul {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 0.82rem;
  line-height: 1.45;

  li {
    margin-bottom: 4px;
    word-break: break-word;
  }

  li.empty {
    list-style: none;
    margin-left: -18px;
    opacity: 0.6;
  }
}

.empty-hint {
  font-size: 0.85rem;
  opacity: 0.65;
  line-height: 1.45;
}

@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
    grid-template-rows: auto auto;
  }

  .preview-panel {
    grid-column: 1 / -1;
    max-height: 240px;
  }
}

@media (max-width: 760px) {
  .interaction-rules-body {
    max-height: calc(100dvh - 52px);
  }

  .subtitle {
    display: none;
  }

  .toolbar {
    gap: 4px;
    margin-bottom: 8px;

    .button {
      font-size: 0.72rem;
      padding: 4px 7px;
    }
  }

  .editor-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .field-grid,
  .effect-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 8px;
  }

  .role-list {
    max-height: min(38dvh, 320px);
    border-radius: 6px;

    .search {
      padding: 6px 8px;
      font-size: 0.8rem;
    }

    li {
      padding: 4px 8px;
    }

    .name {
      font-size: 0.8rem;
    }

    .badge {
      font-size: 0.64rem;
    }
  }

  .rule-editor {
    padding: 8px;
    border-radius: 6px;
  }

  .editor-head {
    margin-bottom: 6px;
    gap: 6px;

    h4 {
      font-size: 0.95rem;
    }
  }

  .card-label-bar {
    margin-bottom: 6px;
    gap: 6px;
  }

  .card-label-tab {
    padding: 2px 8px;
    font-size: 0.68rem;
  }

  .role-ability {
    margin-bottom: 8px;
    padding: 5px 6px;
    font-size: 0.7rem;
    max-height: 4.2em;
    overflow: auto;
  }

  .section {
    margin-bottom: 8px;
  }

  .section-hint {
    display: none;
  }

  .input-row,
  .grimoire-effect-row {
    margin-bottom: 6px;
    padding: 6px;
  }

  .preview-panel {
    max-height: min(28dvh, 220px);
    padding: 8px;
    border-radius: 6px;

    h4 {
      margin-bottom: 6px;
      font-size: 0.88rem;
    }
  }

  .preview-field {
    margin-bottom: 5px;
  }
}
</style>

<style lang="scss">
/* Modal.vue 預設 ul 為 flex-wrap，會破壞左側角色清單的垂直排版 */
.interaction-rules-modal .role-list .role-list-scroll {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: flex-start;
  align-content: flex-start;
  line-height: normal;
}

.interaction-rules-modal .modal {
  width: min(96vw, 1420px);
  max-width: min(96vw, 1420px);
  max-height: min(94dvh, 960px);
  padding: 14px 18px 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > .slot {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    max-height: 100%;
  }

  &.maximized {
    width: 100%;
    max-width: 100%;
    max-height: 100%;

    .interaction-rules-body {
      max-height: calc(100dvh - 60px);
    }
  }

  @media (max-width: 760px) {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
    padding: 8px 10px 10px;

    .interaction-rules-body {
      max-height: calc(100dvh - 40px);
    }

    > .top-right-buttons {
      top: 6px;
      right: 8px;
    }
  }
}
</style>
