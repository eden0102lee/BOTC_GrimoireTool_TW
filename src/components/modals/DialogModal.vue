<template>
  <transition name="modal-fade">
    <div
      v-if="open"
      class="modal-backdrop dialog-backdrop"
      @click="onCancel"
    >
      <div
        class="modal dialog-modal"
        role="dialog"
        :aria-labelledby="title ? 'dialogTitle' : null"
        aria-describedby="dialogMessage"
        @click.stop=""
        @keydown.esc.prevent="onCancel"
      >
        <h3 v-if="title" id="dialogTitle">{{ title }}</h3>
        <p id="dialogMessage" class="dialog-message">{{ message }}</p>
        <input
          v-if="mode === 'prompt'"
          ref="input"
          class="dialog-input"
          type="text"
          :value="value"
          @input="setValue($event.target.value)"
          @keydown.enter.prevent="onSubmit"
          @keydown.esc.prevent="onCancel"
          @keyup.stop=""
        />
        <div class="button-group dialog-actions">
          <button
            v-if="mode !== 'alert'"
            type="button"
            class="button"
            @click="onCancel"
          >
            {{ $t("dialog.cancel") }}
          </button>
          <button
            type="button"
            class="button townsfolk"
            @click="onSubmit"
          >
            {{ mode === "confirm" ? $t("dialog.confirm") : $t("dialog.ok") }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState("dialog", ["open", "mode", "title", "message", "value"]),
  },
  watch: {
    open(isOpen) {
      if (isOpen && this.mode === "prompt") {
        this.$nextTick(() => {
          const el = this.$refs.input;
          if (el) {
            el.focus();
            el.select();
          }
        });
      }
    },
  },
  methods: {
    setValue(value) {
      this.$store.commit("dialog/setValue", value);
    },
    onSubmit() {
      this.$store.dispatch("dialog/submit");
    },
    onCancel() {
      if (this.mode === "alert") {
        this.$store.dispatch("dialog/submit");
        return;
      }
      this.$store.dispatch("dialog/cancel");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.dialog-backdrop {
  z-index: 200;
}

.dialog-modal {
  @include panel-chrome;
  width: min(420px, calc(100vw - 32px));
  max-width: 100%;
  padding: 18px 20px 16px;
  color: $grimoire-text;
  text-align: center;

  h3 {
    margin: 0 0 10px;
    font-size: 1.15rem;
    color: $grimoire-brass-light;
  }

  .dialog-message {
    margin: 0 0 14px;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .dialog-input {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin: 0 0 16px;
    padding: 10px 12px;
    border: 1px solid rgba($grimoire-brass, 0.45);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.55);
    color: $grimoire-text;
    font-size: 1rem;
  }

  .dialog-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;

    .button {
      min-width: 96px;
      cursor: pointer;
    }
  }
}
</style>
