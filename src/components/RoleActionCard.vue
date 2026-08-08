<template>
  <div
    class="role-action-card"
    :class="{
      recorded: isRecorded && !abilityLost && !editing,
      'ability-lost': abilityLost,
      'has-rail': !!(sortable || (reminder && !abilityLost)),
      [team]: true,
    }"
  >
    <div class="card-rail">
      <div
        v-if="reminder && !abilityLost"
        class="reminder-badge-wrap"
        @mouseenter="reminderHover = true"
        @mouseleave="reminderHover = false"
      >
        <button
          type="button"
          class="reminder-badge"
          :aria-expanded="reminderVisible ? 'true' : 'false'"
          :aria-label="$t('recorder.reminderNote')"
          :title="$t('recorder.reminderNote')"
          @click.stop="toggleReminderPopover"
        >
          !
        </button>
        <div v-if="reminderVisible" class="reminder-popover" role="tooltip">
          {{ reminder }}
        </div>
      </div>
      <button
        v-if="sortable"
        type="button"
        class="drag-handle"
        :title="$t('recorder.dragReorder')"
        :aria-label="$t('recorder.dragReorder')"
        @pointerdown.stop.prevent="onDragHandlePointerDown"
      >
        <font-awesome-icon icon="arrows-alt" />
      </button>
    </div>
    <div v-if="isRecorded && !abilityLost && !editing" class="record-actions">
      <button
        type="button"
        class="record-edit-btn"
        :title="$t('recorder.editRecord')"
        @click="startEdit"
      >
        {{ $t("recorder.editRecord") }}
      </button>
      <button
        type="button"
        class="record-delete-btn"
        :title="$t('recorder.deleteRecord')"
        @click="deleteRecord"
      >
        <font-awesome-icon icon="trash-alt" />
      </button>
    </div>
    <div class="card-head">
      <span class="icon" v-if="displayRoleForIcon.id" :style="iconStyle"></span>
      <div class="meta">
        <div class="role-name-row">
          <div class="role-name">{{ displayRoleName }}</div>
          <button
            type="button"
            class="toggle-chip ability-lost-chip"
            :class="{ on: abilityLost }"
            :aria-pressed="abilityLost ? 'true' : 'false'"
            @click="onAbilityLostChipClick"
          >
            {{ $t("recorder.abilityLost") }}
          </button>
        </div>
        <div class="player-name">{{ label }}</div>
      </div>
    </div>

    <template v-if="abilityLost">
      <div class="recorded-summary">{{ $t("recorder.abilityLostHint") }}</div>
    </template>

    <template v-else-if="showForm">
      <div class="fields">
        <label v-for="field in visibleConfigs" :key="field.key" class="field">
          <span>{{ field.label }}</span>
          <select
            v-if="isPlayerInputType(field.type)"
            v-model="formData[field.key]"
          >
            <option value="">—</option>
            <option
              v-for="opt in playersForField(field)"
              :key="opt.index"
              :value="opt.label"
            >
              {{ opt.label }}
            </option>
          </select>
          <select
            v-else-if="field.type === 'role'"
            v-model="formData[field.key]"
          >
            <option value="">—</option>
            <option
              v-for="r in rolesForField(field)"
              :key="r.id"
              :value="r.name"
            >
              {{ r.name }}
            </option>
          </select>
          <select
            v-else-if="field.type === 'select'"
            v-model="formData[field.key]"
          >
            <option value="">—</option>
            <option v-for="opt in field.options" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <input
            v-else-if="field.type === 'number'"
            type="number"
            v-model="formData[field.key]"
          />
          <input v-else type="text" v-model="formData[field.key]" />
        </label>

        <template v-if="interactionRule && visibleEffectToggles.length">
          <div class="grimoire-effects-head">
            {{ $t("interactionRules.grimoireEffects") }}
          </div>
          <div class="toggle-chip-row">
            <button
              v-for="item in visibleEffectToggles"
              :key="item.key"
              type="button"
              class="toggle-chip effect-chip"
              :class="{ on: !!effectToggles[item.key] }"
              :aria-pressed="effectToggles[item.key] ? 'true' : 'false'"
              :title="item.label"
              @click="toggleEffectChip(item.key)"
            >
              {{ item.label }}
            </button>
          </div>
        </template>

        <label class="field full">
          <span>{{ $t("recorder.note") }}</span>
          <input
            type="text"
            v-model="detailNote"
            :placeholder="$t('recorder.notePlaceholder')"
          />
        </label>
      </div>

      <p class="sentence-preview" v-if="interactionRule && liveSentence">
        <span class="preview-label">{{ $t("recorder.sentencePreview") }}</span>
        {{ liveSentence }}
      </p>

      <div class="form-actions">
        <button
          v-if="editing"
          type="button"
          class="btn secondary"
          @click="cancelEdit"
        >
          {{ $t("recorder.cancelEdit") }}
        </button>
        <button type="button" class="btn write" @click="write">
          {{ editing ? $t("recorder.updateRecord") : $t("recorder.write") }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="recorded-summary">{{ recordedSummary }}</div>
    </template>
  </div>
</template>

<script>
import { mapState } from "vuex";
import {
  getRoleInputConfig,
  formatPlayerRoleLabel,
} from "../store/roleInputConfig";
import {
  getRule,
  getSetupRule,
  getDayRule,
  getCardByKey,
  inputsFromRule,
  effectsFromRule,
  parseSetupRoleCardKey,
  buildSetupRoleCardKey,
  resolveDisguiseSetupVariant,
  DISGUISE_SETUP_ROLE_IDS,
  isGoodDisguiseSetup,
  isEvilDisguiseSetup,
  playerHasDisguiseIdentityMarker,
  isDisguiseSetupSeat,
} from "../store/roleInteractionEngine";
import { buildNaturalRoleMessage } from "../store/battleLogFormat";
import { resolvePlayerIndex } from "../store/battleLogEffects";
import {
  isPlayerInputType,
  filterPlayersForInput,
  filterRolesForInput,
  isEffectToggleVisible,
  formatGrimoireEffectSpec,
} from "../store/roleInteractionTypes";
import { resolvePlayerAlignment } from "../store/teamTerms";

export default {
  name: "RoleActionCard",
  props: {
    player: { type: Object, required: true },
    playerIndex: { type: Number, required: true },
    roleCardKey: { type: String, required: true },
    reminder: { type: String, default: "" },
    players: { type: Array, required: true },
    roleOptions: { type: Array, default: () => [] },
    isRecorded: { type: Boolean, default: false },
    recordedEntry: { type: Object, default: null },
    /** When true, use setup rule (開局設置) instead of night/optional rule. */
    setupMode: { type: Boolean, default: false },
    /** When true, resolve daytime ability card for current day. */
    dayMode: { type: Boolean, default: false },
    /** Current day number (1-based) for dayMode. */
    dayNumber: { type: Number, default: 1 },
    /** Prefer a specific card key within the role document. */
    cardKey: { type: String, default: "" },
    /** Original setup role id (e.g. drunk) when surface role was replaced. */
    setupRoleId: { type: String, default: "" },
    /** Allow drag handle for vertical reorder. */
    sortable: { type: Boolean, default: false },
    /** Optional prefill for form fields (e.g. soldier target = self). */
    initialFormData: { type: Object, default: null },
  },
  data() {
    return {
      formData: {},
      detailNote: "",
      editing: false,
      effectToggles: {},
      reminderHover: false,
      reminderPinned: false,
    };
  },
  mounted() {
    document.addEventListener("pointerdown", this.onDocumentPointerDown, true);
  },
  beforeDestroy() {
    document.removeEventListener(
      "pointerdown",
      this.onDocumentPointerDown,
      true,
    );
  },
  watch: {
    configs: {
      immediate: true,
      handler(configs) {
        if (this.editing) return;
        const next = {};
        (configs || []).forEach((c) => {
          const prev =
            this.formData &&
            Object.prototype.hasOwnProperty.call(this.formData, c.key)
              ? this.formData[c.key]
              : "";
          next[c.key] = prev != null ? prev : "";
        });
        const prefill = this.initialFormData || {};
        Object.keys(prefill).forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(next, key) || key) {
            if (prefill[key] != null && prefill[key] !== "") {
              next[key] = prefill[key];
            }
          }
        });
        // Soldier: default target to self
        const roleId =
          this.player && this.player.role && this.player.role.id
            ? String(this.player.role.id).toLowerCase()
            : "";
        if (
          roleId === "soldier" &&
          Object.prototype.hasOwnProperty.call(next, "target") &&
          !next.target
        ) {
          next.target = this.label;
        }
        const setupId = String(this.setupRoleId || roleId || "").toLowerCase();
        if (
          this.setupMode &&
          DISGUISE_SETUP_ROLE_IDS.has(setupId) &&
          Object.prototype.hasOwnProperty.call(next, "p1") &&
          !next.p1
        ) {
          if (setupId === roleId) {
            next.p1 = this.label;
          } else if (
            isEvilDisguiseSetup(setupId) &&
            playerHasDisguiseIdentityMarker(this.player, setupId)
          ) {
            next.p1 = this.label;
          }
        }
        this.formData = next;
        this.initEffectToggles();
      },
    },
    isRecorded(val) {
      if (!val) this.editing = false;
    },
  },
  computed: {
    ...mapState("interactionRules", ["overlay"]),
    reminderVisible() {
      return !!(this.reminderHover || this.reminderPinned);
    },
    interactionRule() {
      const role = this.player && this.player.role;
      if (!role || !role.id) {
        if (this.setupMode && this.setupRoleId) {
          const setupRule = getSetupRule(this.setupRoleId, this.overlay);
          return setupRule && setupRule.enabled ? setupRule : null;
        }
        return null;
      }
      if (this.setupMode) {
        const setupId = this.setupRoleId || role.id;
        const setupRule = getSetupRule(setupId, this.overlay);
        return setupRule && setupRule.enabled ? setupRule : null;
      }
      if (this.cardKey) {
        const byKey = getCardByKey(role.id, this.cardKey, this.overlay);
        if (byKey && byKey.enabled) return byKey;
      }
      if (this.dayMode) {
        const dayRule = getDayRule(role.id, this.dayNumber, this.overlay);
        return dayRule && dayRule.enabled ? dayRule : null;
      }
      const rule = getRule(role.id, this.overlay);
      return rule && rule.enabled ? rule : null;
    },
    displayRoleOptions() {
      if (this.disguiseSetupVariant === "markOnly") return [];
      return this.roleOptions || [];
    },
    disguiseSetupVariant() {
      if (!this.setupMode || !this.setupRoleId) return null;
      const fromSnapshot =
        this.recordedEntry &&
        this.recordedEntry.formSnapshot &&
        this.recordedEntry.formSnapshot.setupVariant;
      if (fromSnapshot && this.isRecorded && !this.editing) return fromSnapshot;
      return resolveDisguiseSetupVariant(
        this.players,
        this.setupRoleId,
        this.playerIndex,
      );
    },
    visibleConfigs() {
      if (!this.setupMode || !this.interactionRule) return this.configs;
      if (this.disguiseSetupVariant === "markOnly") {
        if (isEvilDisguiseSetup(this.setupRoleId || "")) {
          return [];
        }
        return this.configs
          .filter((c) => c.key === "p1")
          .map((c) => ({
            ...c,
            label: this.$t("recorder.setupGoodPlayer"),
          }));
      }
      if (
        isEvilDisguiseSetup(this.setupRoleId || "") &&
        this.disguiseSetupVariant !== "disguise"
      ) {
        return [];
      }
      const sid = String(
        this.setupRoleId || (this.player.role && this.player.role.id) || "",
      ).toLowerCase();
      if (!DISGUISE_SETUP_ROLE_IDS.has(sid)) {
        return this.configs;
      }
      if (
        isDisguiseSetupSeat(this.players, sid, this.playerIndex)
      ) {
        return this.configs.filter((c) => c.key !== "p1");
      }
      return this.configs;
    },
    configs() {
      if (this.interactionRule) {
        return inputsFromRule(this.interactionRule);
      }
      return getRoleInputConfig(this.player.role);
    },
    optionalEffects() {
      if (!this.interactionRule || !this.interactionRule.effects) return [];
      return this.interactionRule.effects.filter((e) =>
        isEffectToggleVisible(e),
      );
    },
    visibleEffectToggles() {
      if (!this.interactionRule || !this.interactionRule.effects) return [];
      return this.interactionRule.effects
        .map((effect, idx) => ({
          effect,
          idx,
          key: this.effectToggleKey(effect, idx),
          label:
            effect.label ||
            formatGrimoireEffectSpec(effect, this.interactionRule.inputs || []),
        }))
        .filter((item) => isEffectToggleVisible(item.effect))
        .filter(
          (item) =>
            this.disguiseSetupVariant !== "markOnly" ||
            item.effect.type === "addReminder",
        );
    },
    label() {
      if (this.setupMode && this.playerIndex < 0) {
        return this.$t("recorder.setupUnassignedPlayer") || "（待選玩家）";
      }
      return formatPlayerRoleLabel(this.player, this.playerIndex);
    },
    displayRoleName() {
      if (this.setupMode && this.setupRoleId) {
        const id = String(this.setupRoleId).toLowerCase();
        const fromOptions = (this.roleOptions || []).find(
          (r) => r && String(r.id || "").toLowerCase() === id,
        );
        if (fromOptions && fromOptions.name) return fromOptions.name;
        if (this.player.role && this.player.role.name)
          return this.player.role.name;
        return id === "marionette"
          ? "提線木偶"
          : id === "drunk"
            ? "酒鬼"
            : id === "lunatic"
              ? "瘋子"
              : id;
      }
      return (
        (this.player.role && (this.player.role.name || this.player.role.id)) ||
        ""
      );
    },
    displayRoleForIcon() {
      if (this.setupMode && this.setupRoleId) {
        const id = String(this.setupRoleId).toLowerCase();
        return (
          (this.roleOptions || []).find(
            (r) => r && String(r.id || "").toLowerCase() === id,
          ) ||
          this.player.role ||
          {}
        );
      }
      return this.player.role || {};
    },
    team() {
      return (this.player.role && this.player.role.team) || "";
    },
    abilityLost() {
      return !!this.player.abilityLost;
    },
    showForm() {
      return !this.isRecorded || this.editing;
    },
    iconStyle() {
      const role = this.displayRoleForIcon;
      if (!role || !role.id) return {};
      try {
        const url = require(
          "../assets/icons/" + (role.imageAlt || role.id) + ".png",
        );
        return { backgroundImage: `url(${url})` };
      } catch (e) {
        return {};
      }
    },
    liveEffects() {
      if (!this.interactionRule) return [];
      return effectsFromRule(
        this.interactionRule,
        this.formData,
        this.players,
        this.effectToggles,
        this.$store.state.roles,
        this.playerIndex,
        { setupVariant: this.disguiseSetupVariant },
      );
    },
    liveSentence() {
      if (!this.interactionRule) return "";
      return buildNaturalRoleMessage(this.interactionRule, {
        players: this.players,
        actorIndex: this.playerIndex,
        formData: this.formData,
        effects: this.liveEffects,
      });
    },
    recordedSummary() {
      if (!this.recordedEntry) return this.$t("recorder.recorded");
      const e = this.recordedEntry;
      let s =
        e.message ||
        `${e.actor} ${e.action}${
          e.target && e.target !== "無" ? " " + e.target : ""
        }`;
      if (e.detail) s += `\n└ ${e.detail}`;
      return s;
    },
  },
  methods: {
    isPlayerInputType,
    toggleReminderPopover() {
      this.reminderPinned = !this.reminderPinned;
    },
    onDocumentPointerDown(event) {
      if (!this.reminderPinned) return;
      const wrap = this.$el && this.$el.querySelector(".reminder-badge-wrap");
      if (wrap && wrap.contains(event.target)) return;
      this.reminderPinned = false;
    },
    onDragHandlePointerDown(event) {
      if (!this.sortable) return;
      this.$emit("drag-handle-start", {
        roleCardKey: this.roleCardKey,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
        event,
      });
    },
    playerOption(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    playersForField(field) {
      const list = filterPlayersForInput(
        this.players,
        field,
        this.playerIndex,
        this.playerOption,
      );
      // Good-side disguise markOnly: prefer alignment; allow unassigned seats.
      if (
        this.disguiseSetupVariant === "markOnly" &&
        field.key === "p1" &&
        isGoodDisguiseSetup(this.setupRoleId || "")
      ) {
        if (field.alignment) return list;
        return list.filter(({ player }) => {
          if (!player || !player.role || !player.role.team) return true;
          return resolvePlayerAlignment(player) === "good";
        });
      }
      return list;
    },
    rolesForField(field) {
      let base = this.displayRoleOptions || [];
      const ruleId =
        this.setupRoleId ||
        (this.interactionRule && this.interactionRule.id) ||
        (this.player.role && this.player.role.id);
      const id = String(ruleId || "").toLowerCase();
      // Legacy: good-side disguise picks townsfolk when rule has no teams.
      if (
        this.setupMode &&
        isGoodDisguiseSetup(id) &&
        !(field.teams && field.teams.length)
      ) {
        base = (this.roleOptions || []).filter(
          (r) =>
            r.team === "townsfolk" && String(r.id || "").toLowerCase() !== id,
        );
      }
      if (
        this.setupMode &&
        isEvilDisguiseSetup(id) &&
        !(field.teams && field.teams.length)
      ) {
        base = (this.roleOptions || []).filter(
          (r) => r.team === "demon" && String(r.id || "").toLowerCase() !== id,
        );
      }
      return filterRolesForInput(base, this.players, field);
    },
    effectToggleKey(effect, idx) {
      return effect.id || `effect-${idx}`;
    },
    initEffectToggles(fromSnapshot) {
      const toggles = {};
      if (!this.interactionRule) {
        this.effectToggles = toggles;
        return;
      }
      this.interactionRule.effects.forEach((effect, idx) => {
        if (!isEffectToggleVisible(effect)) return;
        const key = this.effectToggleKey(effect, idx);
        if (fromSnapshot && fromSnapshot[key] !== undefined) {
          toggles[key] = !!fromSnapshot[key];
        } else {
          toggles[key] = effect.defaultOn !== false;
        }
      });
      this.effectToggles = toggles;
    },
    onAbilityLostChipClick() {
      const value = !this.abilityLost;
      this.$store.commit("players/update", {
        player: this.player,
        property: "abilityLost",
        value,
      });
      if (value) {
        this.editing = false;
        this.$store.dispatch("battleLog/cancelRoleCard", this.roleCardKey);
      }
    },
    toggleEffectChip(key) {
      this.$set(this.effectToggles, key, !this.effectToggles[key]);
    },
    startEdit() {
      const snap =
        (this.recordedEntry && this.recordedEntry.formSnapshot) || {};
      const next = {};
      this.configs.forEach((c) => {
        next[c.key] =
          snap.formData && snap.formData[c.key] != null
            ? snap.formData[c.key]
            : "";
      });
      if (
        this.recordedEntry &&
        this.recordedEntry.target &&
        this.recordedEntry.target !== "無" &&
        !snap.formData
      ) {
        const parts = String(this.recordedEntry.target).split(" & ");
        if (next.target !== undefined) next.target = parts[0] || "";
        if (next.p1 !== undefined) next.p1 = parts[0] || "";
        if (next.p2 !== undefined) next.p2 = parts[1] || "";
        if (next.p3 !== undefined) next.p3 = parts[2] || "";
      }
      this.formData = next;
      this.detailNote = snap.detailNote || "";
      this.initEffectToggles(snap.effectToggles || {});
      this.editing = true;
    },
    cancelEdit() {
      this.editing = false;
      this.detailNote = "";
    },
    deleteRecord() {
      if (this.abilityLost) return;
      if (!window.confirm(this.$t("recorder.confirmCancelRecord"))) return;
      const key =
        (this.recordedEntry && this.recordedEntry.roleCardKey) ||
        this.roleCardKey;
      this.editing = false;
      this.$emit("delete", key);
    },
    ensureDisguiseSetupFormData() {
      if (!this.setupMode || this.disguiseSetupVariant !== "disguise") return;
      if (!Object.prototype.hasOwnProperty.call(this.formData, "p1")) return;
      if (this.formData.p1 && String(this.formData.p1).trim()) return;
      this.$set(this.formData, "p1", this.label);
    },
    write() {
      if (this.abilityLost) return;
      this.ensureDisguiseSetupFormData();
      if (
        this.setupMode &&
        this.disguiseSetupVariant === "markOnly" &&
        (!this.formData.p1 || !String(this.formData.p1).trim())
      ) {
        return;
      }
      if (
        this.setupMode &&
        String(this.setupRoleId || "").toLowerCase() === "fortuneteller" &&
        (!this.formData.p1 || !String(this.formData.p1).trim())
      ) {
        return;
      }
      if (
        this.setupMode &&
        this.disguiseSetupVariant === "disguise" &&
        (!this.formData.r1 || !String(this.formData.r1).trim())
      ) {
        return;
      }
      let targetStr = "";
      const details = [];
      const actionLabel =
        (this.interactionRule &&
          this.interactionRule.sentence &&
          this.interactionRule.sentence.action) ||
        "選擇";

      this.configs.forEach((c) => {
        const val = this.formData[c.key];
        if (!val && val !== 0) return;
        if (c.key === "p1" || c.key === "target") {
          targetStr = String(val);
        } else if (c.key === "p2" && targetStr) {
          targetStr += ` & ${val}`;
        } else if (c.key === "p3" && targetStr) {
          targetStr += ` & ${val}`;
        } else if (c.key === "evilTarget" && targetStr) {
          targetStr += ` & ${val}`;
        } else if (!this.interactionRule) {
          details.push(`${c.label}: ${val}`);
        }
      });

      let finalDetail = details.join(" | ");
      if (this.detailNote.trim()) {
        finalDetail = finalDetail
          ? `${finalDetail} | ${this.detailNote.trim()}`
          : this.detailNote.trim();
      }

      const effects = this.interactionRule ? this.liveEffects : null;

      const message = this.interactionRule
        ? buildNaturalRoleMessage(this.interactionRule, {
            players: this.players,
            actorIndex: this.playerIndex,
            formData: this.formData,
            effects,
          })
        : null;

      let roleCardKey = this.roleCardKey;
      // Disguise setup remaps the setup card onto the chosen player seat.
      const setupId = String(this.setupRoleId || "").toLowerCase();
      if (
        this.setupMode &&
        this.formData.p1 &&
        DISGUISE_SETUP_ROLE_IDS.has(setupId)
      ) {
        const parsed = parseSetupRoleCardKey(this.roleCardKey);
        const p1Idx = resolvePlayerIndex(this.players, this.formData.p1);
        if (parsed && p1Idx >= 0) {
          roleCardKey = buildSetupRoleCardKey(
            parsed.phaseId,
            p1Idx,
            parsed.roleId,
          );
        }
      }

      this.$emit("record", {
        roleCardKey,
        actor: this.displayRoleName,
        action: actionLabel,
        target: targetStr || "無",
        detail: finalDetail || null,
        message,
        effects,
        roleId: this.setupRoleId || this.player.role.id,
        formSnapshot: {
          ruleId: this.interactionRule
            ? this.setupRoleId || this.player.role.id
            : null,
          setup: !!this.setupMode,
          dayMode: !!this.dayMode,
          dayNumber: this.dayMode ? this.dayNumber : null,
          cardKey:
            this.cardKey ||
            (this.interactionRule && this.interactionRule.cardKey) ||
            null,
          cardLabel:
            (this.interactionRule &&
              (this.interactionRule.cardLabel || this.interactionRule.label)) ||
            null,
          setupVariant: this.disguiseSetupVariant || null,
          formData: { ...this.formData },
          detailNote: this.detailNote,
          effectToggles: { ...this.effectToggles },
        },
      });
      this.editing = false;
      this.detailNote = "";
      const next = {};
      this.configs.forEach((c) => {
        next[c.key] = "";
      });
      this.formData = next;
      this.initEffectToggles();
    },
  },
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

.role-action-card {
  position: relative;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  text-align: left;

  &.recorded,
  &.ability-lost {
    opacity: 0.55;
    filter: grayscale(0.7);
  }

  &.demon {
    border-color: rgba($demon, 0.5);
  }
  &.minion {
    border-color: rgba($minion, 0.5);
  }
  &.townsfolk {
    border-color: rgba($townsfolk, 0.4);
  }
  &.outsider {
    border-color: rgba($outsider, 0.4);
  }
}

.reminder-badge-wrap {
  position: relative;
  z-index: 3;
}

.card-rail {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.reminder-badge {
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 214, 153, 0.85);
  background: rgba(80, 50, 0, 0.9);
  color: #ffd699;
  font-size: 0.72rem;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover,
  &[aria-expanded="true"] {
    background: rgba(120, 80, 0, 0.95);
    color: #fff0cc;
  }
}

.drag-handle {
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
  &:active {
    cursor: grabbing;
    background: rgba(70, 213, 255, 0.25);
    border-color: rgba(70, 213, 255, 0.7);
    color: #e8fbff;
  }
}

.reminder-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 5;
  min-width: 160px;
  max-width: min(260px, 70vw);
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 214, 153, 0.45);
  background: rgba(20, 16, 8, 0.96);
  color: rgba(255, 245, 220, 0.95);
  font-size: 0.7rem;
  font-style: italic;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.card-head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-right: 8px;
}

.has-rail .card-head {
  padding-left: 22px;
}

.role-action-card.recorded .card-head {
  padding-right: 92px;
}

.icon {
  width: 2.5rem;
  height: 2.5rem;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border-radius: 4px;
}

.meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
}

.role-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.role-name {
  font-weight: bold;
  font-size: 0.9rem;
  line-height: 1.2;
}
.player-name {
  font-size: 0.75rem;
  line-height: 1.2;
  opacity: 0.75;
}

.toggle-chip-row {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 4px;
}

.toggle-chip {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.7rem;
  line-height: 1.25;
  cursor: pointer;
  user-select: none;
  max-width: 100%;
  text-align: left;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &.on {
    background: rgba(70, 213, 255, 0.22);
    border-color: rgba(70, 213, 255, 0.75);
    color: #e8fbff;
  }

  &.ability-lost-chip {
    margin: 0;
    flex-shrink: 0;
    padding: 2px 8px;
    font-size: 0.65rem;
    &.on {
      background: rgba(255, 120, 100, 0.22);
      border-color: rgba(255, 140, 120, 0.8);
      color: #ffe8e4;
    }
  }
}

.grimoire-effects-head {
  grid-column: 1 / -1;
  font-size: 0.72rem;
  font-weight: bold;
  color: #ffd699;
  margin-top: 2px;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 6px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.7rem;
  &.full {
    grid-column: 1 / -1;
  }
  span {
    opacity: 0.7;
  }
  select,
  input {
    width: 100%;
    padding: 3px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 0.75rem;
  }
}

.sentence-preview {
  font-size: 0.72rem;
  margin: 4px 0 8px;
  line-height: 1.35;
  word-break: break-word;
  white-space: pre-line;

  .preview-label {
    opacity: 0.65;
    margin-right: 4px;
  }
}

.recorded-summary {
  font-size: 0.75rem;
  margin: 6px 0;
  word-break: break-word;
  white-space: pre-line;
}

.form-actions {
  display: flex;
  gap: 6px;
}

.btn {
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
  &.write {
    background: rgba(0, 49, 173, 0.75);
    &:hover {
      background: rgba(0, 49, 173, 0.95);
    }
  }
  &.secondary {
    background: rgba(0, 0, 0, 0.45);
    &:hover {
      background: rgba(60, 60, 60, 0.7);
    }
  }
}

.record-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
}

.record-edit-btn {
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
  &:hover {
    background: rgba(150, 100, 0, 0.85);
    color: #fff4d6;
  }
}

.record-delete-btn {
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
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 0, 0, 0.15);
  }
}
</style>
