<template>
  <div class="manual-log-card">
    <div class="title">{{ $t("recorder.manualTitle") }}</div>

    <div class="add-buttons">
      <button type="button" class="add-btn player" @click="addToken('player')">
        {{ $t("recorder.addPlayer") }}
      </button>
      <button type="button" class="add-btn role" @click="addToken('role')">
        {{ $t("recorder.addRole") }}
      </button>
      <button type="button" class="add-btn action" @click="addToken('action')">
        {{ $t("recorder.addAction") }}
      </button>
      <button type="button" class="add-btn status" @click="addToken('status')">
        {{ $t("recorder.addStatus") }}
      </button>
      <button type="button" class="add-btn input" @click="addToken('input')">
        {{ $t("recorder.addInput") }}
      </button>
    </div>

    <div class="token-row" v-if="tokens.length">
      <div
        v-for="(token, idx) in tokens"
        :key="token.id"
        class="token-chip"
        :class="token.type"
      >
        <button
          type="button"
          class="move-btn"
          :disabled="idx === 0"
          :title="$t('recorder.moveTokenLeft')"
          @click="moveToken(idx, -1)"
        >
          <font-awesome-icon icon="chevron-left" />
        </button>
        <select
          v-if="token.type === 'player'"
          v-model="token.value"
          class="token-control"
        >
          <option value="">{{ $t("recorder.pickPlayer") }}</option>
          <option v-for="(p, i) in players" :key="i" :value="label(p, i)">
            {{ label(p, i) }}
          </option>
        </select>
        <select
          v-else-if="token.type === 'role'"
          v-model="token.value"
          class="token-control role-select"
          @change="onRoleChange(token)"
        >
          <option value="">{{ $t("recorder.pickRole") }}</option>
          <option
            v-for="r in scriptRoles"
            :key="r.id"
            :value="r.name || r.id"
          >
            {{ r.name || r.id }}
          </option>
        </select>
        <select
          v-else-if="token.type === 'action'"
          v-model="token.value"
          class="token-control"
        >
          <option value="">{{ $t("recorder.pickAction") }}</option>
          <option v-for="v in verbs" :key="v" :value="v">{{ v }}</option>
        </select>
        <select
          v-else-if="token.type === 'status'"
          v-model="token.value"
          class="token-control"
        >
          <option value="">{{ $t("recorder.pickStatus") }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <input
          v-else
          type="text"
          v-model="token.value"
          class="token-control"
          :placeholder="$t('recorder.notePlaceholder')"
        />
        <button
          type="button"
          class="move-btn"
          :disabled="idx === tokens.length - 1"
          :title="$t('recorder.moveTokenRight')"
          @click="moveToken(idx, 1)"
        >
          <font-awesome-icon icon="chevron-right" />
        </button>
        <button
          type="button"
          class="remove-btn"
          :title="$t('recorder.removeToken')"
          @click="removeToken(idx)"
        >
          ×
        </button>
      </div>
    </div>

    <p class="sentence-preview" v-if="sentence">
      <span class="preview-label">{{ $t("recorder.sentencePreview") }}</span>
      {{ sentence }}
    </p>
    <p class="sentence-preview empty" v-else>
      {{ $t("recorder.sentenceHint") }}
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
import { previewEffectsFromTokens } from "../store/battleLogEffects";

let tokenSeq = 0;

export default {
  name: "ManualLogCard",
  props: {
    players: { type: Array, required: true },
    scriptRoles: { type: Array, default: () => [] },
    initialTokens: { type: Array, default: null },
    editEntryId: { type: String, default: null },
    linkedMode: { type: Boolean, default: false },
  },
  data() {
    return {
      tokens: [],
      verbs: ["選擇", "得知", "標記", "提名", "使用能力", "白天行動", "其他"],
      statuses: ["死亡", "中毒", "醉酒", "復活", "失去能力"],
    };
  },
  computed: {
    editing() {
      return !!this.editEntryId;
    },
    sentence() {
      return this.tokens
        .map((t) => (t.value != null ? String(t.value).trim() : ""))
        .filter(Boolean)
        .join(" ");
    },
    canWrite() {
      return this.tokens.some(
        (t) => t.value != null && String(t.value).trim() !== "",
      );
    },
    canDelete() {
      return this.editing && this.tokens.length === 0;
    },
    primaryLabel() {
      if (this.canDelete) return this.$t("recorder.deleteRecord");
      if (this.editing) return this.$t("recorder.updateRecord");
      return this.$t("recorder.write");
    },
  },
  watch: {
    editEntryId: {
      immediate: true,
      handler() {
        this.syncTokensFromInitial();
      },
    },
    linkedMode() {
      this.updatePreview();
    },
    tokens: {
      deep: true,
      handler() {
        this.updatePreview();
      },
    },
  },
  beforeDestroy() {
    this.clearPreview();
  },
  methods: {
    syncTokensFromInitial() {
      const tokens = this.initialTokens;
      if (Array.isArray(tokens) && tokens.length) {
        this.tokens = tokens.map((t) => ({
          id: t.id || `t-${Date.now()}-${tokenSeq++}`,
          type: t.type,
          value: t.value != null ? t.value : "",
          roleId: t.roleId || null,
        }));
      } else if (!this.editEntryId) {
        this.tokens = [];
      }
    },
    label(p, i) {
      return formatPlayerRoleLabel(p, i);
    },
    onRoleChange(token) {
      const role = this.scriptRoles.find(
        (r) => (r.name || r.id) === token.value,
      );
      token.roleId = role ? role.id : null;
      this.updatePreview();
    },
    updatePreview() {
      if (!this.linkedMode) {
        this.clearPreview();
        return;
      }
      const snapshot = this.tokens.map((t) => ({
        type: t.type,
        value: t.value,
        roleId: t.roleId,
      }));
      const effects = previewEffectsFromTokens(snapshot, this.players);
      this.$store.dispatch("battleLog/setPreviewEffects", effects);
    },
    clearPreview() {
      this.$store.dispatch("battleLog/clearPreviewEffects");
    },
    addToken(type) {
      const defaults = {
        player: "",
        role: "",
        action: "選擇",
        status: "死亡",
        input: "",
      };
      this.tokens.push({
        id: `t-${Date.now()}-${tokenSeq++}`,
        type,
        value: defaults[type] != null ? defaults[type] : "",
        roleId: null,
      });
    },
    removeToken(idx) {
      this.tokens.splice(idx, 1);
    },
    moveToken(idx, delta) {
      const next = idx + delta;
      if (next < 0 || next >= this.tokens.length) return;
      const copy = this.tokens.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      this.tokens = copy;
    },
    reset() {
      this.tokens = [];
      this.clearPreview();
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
      const players = this.tokens
        .filter((t) => t.type === "player" && t.value)
        .map((t) => t.value);
      const actions = this.tokens
        .filter((t) => t.type === "action" && t.value)
        .map((t) => t.value);
      const statuses = this.tokens
        .filter((t) => t.type === "status" && t.value)
        .map((t) => t.value);
      const inputs = this.tokens
        .filter((t) => t.type === "input" && String(t.value).trim())
        .map((t) => String(t.value).trim());

      const actor = players[0] || "說書人";
      const action =
        actions[0] || statuses[0] || (inputs.length ? "備註" : "行動");

      this.$emit("record", {
        actor,
        action,
        target: players[1] || "無",
        detail: inputs.length ? inputs.join(" ｜ ") : null,
        status: null,
        message: this.sentence,
        formSnapshot: {
          tokens: this.tokens.map((t) => ({
            type: t.type,
            value: t.value,
            roleId: t.roleId || null,
          })),
        },
        editEntryId: this.editEntryId || null,
      });
      this.reset();
    },
  },
};
</script>

<style scoped lang="scss">
.manual-log-card {
  background: rgba(40, 30, 0, 0.55);
  border: 1px dashed rgba(255, 200, 80, 0.55);
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
  color: #ffd699;
}

.add-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.add-btn {
  flex: 1 1 auto;
  min-width: 64px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.45);
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    filter: brightness(1.15);
  }
  &.player {
    border-color: rgba(70, 213, 255, 0.55);
  }
  &.role {
    border-color: rgba(140, 255, 160, 0.55);
  }
  &.action {
    border-color: rgba(255, 214, 153, 0.55);
  }
  &.status {
    border-color: rgba(206, 1, 0, 0.55);
  }
  &.input {
    border-color: rgba(180, 180, 255, 0.55);
  }
}

.token-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: stretch;
  margin-bottom: 8px;
}

.token-chip {
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  padding: 2px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);

  &.player {
    border-color: rgba(70, 213, 255, 0.45);
  }
  &.role {
    border-color: rgba(140, 255, 160, 0.45);
  }
  &.action {
    border-color: rgba(255, 214, 153, 0.45);
  }
  &.status {
    border-color: rgba(206, 1, 0, 0.45);
  }
  &.input {
    border-color: rgba(180, 180, 255, 0.45);
    flex: 1 1 120px;
  }
}

.token-control {
  min-width: 0;
  max-width: 140px;
  padding: 3px 4px;
  border-radius: 4px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.72rem;
}

.token-chip.input .token-control,
.token-chip.role .token-control {
  max-width: none;
  width: 100%;
  flex: 1;
}

.remove-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 0, 0, 0.15);
  }
}

.move-btn {
  flex-shrink: 0;
  width: 20px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 214, 153, 0.85);
  cursor: pointer;
  font-size: 0.65rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) {
    color: #fff;
    background: rgba(255, 200, 80, 0.2);
  }
  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
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
    border: 1px solid rgba(255, 200, 80, 0.5);
    background: rgba(120, 80, 0, 0.75);
    &:hover:not(:disabled) {
      background: rgba(150, 100, 0, 0.9);
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
