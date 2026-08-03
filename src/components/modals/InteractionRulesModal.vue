<template>
  <Modal
    class="interaction-rules-modal"
    v-if="modals.interactionRules"
    @close="toggleModal('interactionRules')"
  >
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
        <ul>
          <li
            v-for="item in filteredRoles"
            :key="item.role.id"
            :class="{
              active: selectedRoleId === item.role.id,
              [item.status]: true,
            }"
            @click="selectRole(item.role)"
          >
            <span class="name">{{ item.role.name || item.role.id }}</span>
            <span class="badge">{{ statusLabel(item.status) }}</span>
          </li>
        </ul>
      </aside>

      <section class="rule-editor" v-if="editRule">
        <div class="editor-head">
          <h4>{{ editRule.name || editRule.id }}</h4>
          <label class="enabled-toggle">
            <input type="checkbox" v-model="editRule.enabled" />
            {{ $t("interactionRules.enabled") }}
          </label>
        </div>

        <div class="section">
          <div class="section-head">
            <span>{{ $t("interactionRules.inputs") }}</span>
            <button type="button" class="mini-btn" @click="addInput">+</button>
          </div>
          <div
            v-for="(input, idx) in editRule.inputs"
            :key="'in-' + idx"
            class="row-block"
          >
            <input v-model="input.key" placeholder="key" class="short" />
            <select v-model="input.type">
              <option value="player">{{ inputTypeLabel("player") }}</option>
              <option value="alivePlayer">{{ inputTypeLabel("alivePlayer") }}</option>
              <option value="otherPlayer">{{ inputTypeLabel("otherPlayer") }}</option>
              <option value="role">{{ inputTypeLabel("role") }}</option>
              <option value="select">{{ inputTypeLabel("select") }}</option>
              <option value="number">{{ inputTypeLabel("number") }}</option>
              <option value="text">{{ inputTypeLabel("text") }}</option>
            </select>
            <input v-model="input.label" :placeholder="$t('interactionRules.label')" />
            <label class="inline-check">
              <input type="checkbox" v-model="input.required" />
              req
            </label>
            <button type="button" class="mini-btn danger" @click="removeInput(idx)">×</button>
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
            <div class="row-block effect-fields">
              <select v-model="effect.type" @change="onEffectTypeChange(effect)">
                <option
                  v-for="action in grimoireActionTypes"
                  :key="action.type"
                  :value="action.type"
                >
                  {{ action.label }}
                </option>
              </select>
              <select v-model="effect.targetFrom">
                <option value="">{{ $t("interactionRules.pickTarget") }}</option>
                <option
                  v-for="input in playerInputsForEffects"
                  :key="input.key"
                  :value="input.key"
                >
                  {{ input.label || input.key }}
                </option>
              </select>
              <template v-if="effectNeedsReminder(effect.type)">
                <select
                  v-model="effect.reminderRole"
                  class="short"
                  @change="onReminderRoleChange(effect)"
                >
                  <option :value="editRule.id">
                    {{ editRule.name || editRule.id }}（{{ $t("interactionRules.thisRole") }}）
                  </option>
                  <optgroup :label="$t('interactionRules.otherRoleTokens')">
                    <option
                      v-for="r in otherScriptRolesWithReminders"
                      :key="r.id"
                      :value="r.id"
                    >
                      {{ r.name }} — {{ r.reminders.join("、") }}
                    </option>
                  </optgroup>
                  <option :value="genericReminderRole">
                    {{ $t("interactionRules.genericToken") }}
                  </option>
                </select>
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
              </template>
              <input
                v-model="effect.label"
                :placeholder="$t('interactionRules.cardToggleLabel')"
              />
              <select
                v-if="bindToOptions(idx).length"
                v-model="effect.bindTo"
                class="short"
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
              <label class="inline-check" v-if="!effect.bindTo">
                <input type="checkbox" v-model="effect.optional" />
                {{ $t("interactionRules.optionalToggle") }}
              </label>
              <label class="inline-check" v-if="effect.optional && !effect.bindTo">
                <input type="checkbox" v-model="effect.defaultOn" />
                {{ $t("interactionRules.defaultOn") }}
              </label>
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
                v-for="r in scriptRoles"
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
            <label
              v-for="item in previewVisibleEffects"
              :key="'pt-' + item.idx"
              class="preview-field"
            >
              <span>{{ item.label }}</span>
              <input
                type="checkbox"
                v-model="previewToggles[item.key]"
              />
            </label>
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
  </Modal>
</template>

<script>
import { mapMutations, mapState, mapGetters } from "vuex";
import Modal from "./Modal";
import {
  buildSentence,
  effectsFromRule,
  describeEffects,
  coverageStatus,
  normalizeRule,
} from "../../store/roleInteractionEngine";
import {
  getRoleInputConfig,
  formatPlayerRoleLabel,
} from "../../store/roleInputConfig";
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
} from "../../store/roleInteractionTypes";

export default {
  name: "InteractionRulesModal",
  components: { Modal },
  data() {
    return {
      search: "",
      selectedRoleId: null,
      editRule: null,
      previewForm: {},
      previewToggles: {},
      grimoireActionTypes: GRIMOIRE_ACTION_TYPES,
      reminderSheetUrl: COMMUNITY_TRANSLATIONS_SHEET_URL,
      genericReminderRole: GENERIC_REMINDER_ROLE,
    };
  },
  computed: {
    ...mapState(["modals", "roles"]),
    ...mapState("interactionRules", ["overlay", "editorDirty"]),
    ...mapState("players", { boardPlayers: "players" }),
    ...mapGetters("interactionRules", ["ruleById"]),
    scriptRoles() {
      return [...this.roles.values()];
    },
    roleItems() {
      return this.scriptRoles.map((role) => ({
        role,
        status: coverageStatus(role, this.overlay, getRoleInputConfig),
      }));
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
    previewSentence() {
      if (!this.editRule) return "";
      return buildSentence(this.editRule, {
        actor: this.editRule.name,
        formData: this.previewForm,
      });
    },
    previewEffectLines() {
      if (!this.editRule) return [];
      const effects = effectsFromRule(
        this.editRule,
        this.previewForm,
        this.previewPlayers,
        this.previewToggles,
        this.roles,
      );
      return describeEffects(effects, this.previewPlayers);
    },
    playerInputsForEffects() {
      if (!this.editRule || !this.editRule.inputs) return [];
      return this.editRule.inputs.filter((input) => isPlayerInputType(input.type));
    },
    roleReminderNames() {
      return reminderNamesForRole(
        this.editRule ? this.editRule.id : null,
        this.roles,
        { includeGeneric: true },
      );
    },
    scriptRolesWithReminders() {
      return rolesWithReminders(this.roles);
    },
    otherScriptRolesWithReminders() {
      if (!this.editRule) return this.scriptRolesWithReminders;
      return this.scriptRolesWithReminders.filter(
        (r) => r.id !== this.editRule.id,
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
      const roleId = effect.reminderRole || (this.editRule && this.editRule.id);
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
          effect.reminderRole = this.editRule ? this.editRule.id : GENERIC_REMINDER_ROLE;
        }
      } else {
        effect.reminderName = "";
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
        input.type,
        this.previewActorIndex,
        this.playerLabel,
      );
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
    loadRuleForSelected() {
      const role = this.selectedRole;
      if (!role) {
        this.editRule = null;
        return;
      }
      const existing = this.ruleById(role.id);
      if (existing) {
        this.editRule = JSON.parse(JSON.stringify(existing));
      } else {
        this.editRule = null;
      }
      if (this.editRule) {
        if (!this.editRule.sentence) {
          this.editRule.sentence = { action: "使用能力", template: "{actor} → {action}" };
        }
        this.syncPreviewForm(this.editRule);
      }
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
      this.editRule = normalizeRule({
        id: role.id,
        name: role.name || role.id,
        enabled: true,
        inputs: [{ key: "target", type: "player", label: "目標對象" }],
        sentence: {
          action: "使用能力",
          template: "{actor} → {action} → 選擇 {target}",
        },
        effects: [],
        notes: "",
      });
    },
    async createDraft() {
      const role = this.selectedRole;
      if (!role) return;
      const draft = await this.$store.dispatch(
        "interactionRules/createDraftFromLegacy",
        role,
      );
      if (draft) {
        this.editRule = JSON.parse(JSON.stringify(draft));
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
      if (!this.editRule) return;
      const firstTarget =
        this.playerInputsForEffects[0] &&
        this.playerInputsForEffects[0].key;
      const spec = {
        type: "addReminder",
        targetFrom: firstTarget || "target",
        reminderName: "",
        reminderRole: this.editRule.id,
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
      if (!this.editRule) return;
      this.$store.commit("interactionRules/upsertRule", this.editRule);
      this.$store.dispatch("interactionRules/saveOverlay");
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

.subtitle {
  font-size: 0.85rem;
  opacity: 0.75;
  margin: 0 0 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 200px 1fr 240px;
  gap: 12px;
  min-height: 420px;
  max-height: 65vh;
}

.role-list {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .search {
    padding: 6px 8px;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.4);
    color: white;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }

  li {
    padding: 6px 8px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    gap: 2px;

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

  .name {
    font-size: 0.8rem;
  }
  .badge {
    font-size: 0.65rem;
    opacity: 0.85;
  }
}

.rule-editor {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
  text-align: left;

  &.empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 8px;
  }
}

.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h4 {
    margin: 0;
  }
}

.enabled-toggle {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.section {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 0.75rem;
    margin-bottom: 4px;
    opacity: 0.8;
  }

  input,
  select,
  textarea {
    width: 100%;
    margin-bottom: 6px;
    padding: 4px 6px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
    font-size: 0.8rem;
  }
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 6px;
}

.section-hint {
  margin: 0 0 8px;
  font-size: 0.68rem;
  opacity: 0.7;
  line-height: 1.35;

  .sheet-link {
    color: #8fd4ff;
    margin-left: 4px;
  }
}

.grimoire-effects .grimoire-effect-row {
  margin-bottom: 10px;
  padding: 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 214, 153, 0.2);
}

.effect-summary {
  font-size: 0.72rem;
  color: #ffd699;
  margin-bottom: 4px;
}

.effect-fields {
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
}

.row-block {
  display: grid;
  grid-template-columns: 70px 90px 1fr auto auto auto;
  gap: 4px;
  margin-bottom: 4px;
  align-items: center;

  .short {
    width: 100%;
  }
}

.inline-check {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  white-space: nowrap;
}

.mini-btn {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;

  &.danger {
    color: #ffb0b0;
  }
}

.hint {
  font-size: 0.7rem;
  opacity: 0.65;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.preview-panel {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
  text-align: left;

  h4 {
    margin: 0 0 8px;
    font-size: 0.9rem;
  }
}

.preview-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
  font-size: 0.75rem;

  select,
  input {
    padding: 3px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.45);
    color: white;
  }
}

.preview-label {
  font-size: 0.7rem;
  opacity: 0.7;
}

.preview-sentence p {
  margin: 4px 0 10px;
  font-size: 0.8rem;
  line-height: 1.35;
  word-break: break-word;
}

.preview-effects ul {
  margin: 4px 0 0;
  padding-left: 16px;
  font-size: 0.75rem;

  li.empty {
    list-style: none;
    margin-left: -16px;
    opacity: 0.6;
  }
}

.empty-hint {
  font-size: 0.8rem;
  opacity: 0.65;
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }
}
</style>

<style lang="scss">
.interaction-rules-modal .modal {
  max-width: min(95%, calc(100vw - 24px));
  width: 1100px;
  max-height: min(92%, calc(100dvh - 24px));
  overflow-y: auto;
}
</style>
