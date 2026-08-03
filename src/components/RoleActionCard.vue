<template>
  <div
    class="role-action-card"
    :class="{
      recorded: isRecorded && !abilityLost && !editing,
      'ability-lost': abilityLost,
      [team]: true,
    }"
  >
    <div class="card-head">
      <span
        class="icon"
        v-if="player.role && player.role.id"
        :style="iconStyle"
      ></span>
      <div class="meta">
        <div class="role-name">{{ player.role.name || player.role.id }}</div>
        <div class="player-name">{{ label }}</div>
      </div>
    </div>

    <label class="ability-lost-toggle">
      <input
        type="checkbox"
        :checked="abilityLost"
        @change="onAbilityLostChange"
      />
      <span>{{ $t("recorder.abilityLost") }}</span>
    </label>

    <p class="reminder" v-if="reminder && !abilityLost">{{ reminder }}</p>

    <template v-if="abilityLost">
      <div class="recorded-summary">{{ $t("recorder.abilityLostHint") }}</div>
    </template>

    <template v-else-if="showForm">
      <div class="fields">
        <label v-for="field in configs" :key="field.key" class="field">
          <span>{{ field.label }}</span>
          <select
            v-if="field.type === 'player'"
            v-model="formData[field.key]"
          >
            <option value="">—</option>
            <option
              v-for="(p, i) in players"
              :key="i"
              :value="playerOption(p, i)"
            >
              {{ playerOption(p, i) }}
            </option>
          </select>
          <select
            v-else-if="field.type === 'role'"
            v-model="formData[field.key]"
          >
            <option value="">—</option>
            <option v-for="r in roleOptions" :key="r.id" :value="r.name">
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
        <label class="field full">
          <span>{{ $t("recorder.note") }}</span>
          <input
            type="text"
            v-model="detailNote"
            :placeholder="$t('recorder.notePlaceholder')"
          />
        </label>
      </div>
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
      <button type="button" class="btn edit" @click="startEdit">
        {{ $t("recorder.editRecord") }}
      </button>
    </template>
  </div>
</template>

<script>
import {
  getRoleInputConfig,
  formatPlayerRoleLabel,
} from "../store/roleInputConfig";

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
  },
  data() {
    return {
      formData: {},
      detailNote: "",
      editing: false,
    };
  },
  watch: {
    configs: {
      immediate: true,
      handler(configs) {
        if (this.editing) return;
        const next = {};
        (configs || []).forEach((c) => {
          next[c.key] = "";
        });
        this.formData = next;
      },
    },
    isRecorded(val) {
      if (!val) this.editing = false;
    },
  },
  computed: {
    configs() {
      return getRoleInputConfig(this.player.role);
    },
    label() {
      return formatPlayerRoleLabel(this.player, this.playerIndex);
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
      const role = this.player.role;
      if (!role || !role.id) return {};
      try {
        const url = require("../assets/icons/" +
          (role.imageAlt || role.id) +
          ".png");
        return { backgroundImage: `url(${url})` };
      } catch (e) {
        return {};
      }
    },
    recordedSummary() {
      if (!this.recordedEntry) return this.$t("recorder.recorded");
      const e = this.recordedEntry;
      let s = e.message || `${e.actor} -> ${e.action} -> ${e.target}`;
      if (e.detail) s += ` （${e.detail}）`;
      return s;
    },
  },
  methods: {
    playerOption(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    onAbilityLostChange(event) {
      const value = !!event.target.checked;
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
      this.editing = true;
    },
    cancelEdit() {
      this.editing = false;
      this.detailNote = "";
    },
    write() {
      if (this.abilityLost) return;
      let targetStr = "";
      const details = [];
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
        } else {
          details.push(`${c.label}: ${val}`);
        }
      });
      let finalDetail = details.join(" | ");
      if (this.detailNote.trim()) {
        finalDetail = finalDetail
          ? `${finalDetail} | ${this.detailNote.trim()}`
          : this.detailNote.trim();
      }
      this.$emit("record", {
        roleCardKey: this.roleCardKey,
        actor: this.player.role.name || this.player.role.id,
        action: "使用能力",
        target: targetStr || "無",
        detail: finalDetail || null,
        formSnapshot: {
          formData: { ...this.formData },
          detailNote: this.detailNote,
        },
      });
      this.editing = false;
      this.detailNote = "";
      const next = {};
      this.configs.forEach((c) => {
        next[c.key] = "";
      });
      this.formData = next;
    },
  },
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

.role-action-card {
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

.card-head {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon {
  width: 32px;
  height: 32px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.role-name {
  font-weight: bold;
  font-size: 0.9rem;
}
.player-name {
  font-size: 0.75rem;
  opacity: 0.75;
}

.ability-lost-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
  font-size: 0.72rem;
  cursor: pointer;
  user-select: none;

  input {
    margin: 0;
    cursor: pointer;
  }
}

.reminder {
  margin: 6px 0;
  font-size: 0.7rem;
  opacity: 0.7;
  font-style: italic;
  line-height: 1.3;
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

.recorded-summary {
  font-size: 0.75rem;
  margin: 6px 0;
  word-break: break-word;
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
  &.edit {
    background: rgba(120, 80, 0, 0.75);
    &:hover {
      background: rgba(150, 100, 0, 0.9);
    }
  }
  &.secondary {
    background: rgba(0, 0, 0, 0.45);
    &:hover {
      background: rgba(60, 60, 60, 0.7);
    }
  }
  &.cancel {
    background: rgba(90, 30, 30, 0.7);
    &:hover {
      background: rgba(120, 40, 40, 0.9);
    }
  }
}
</style>
