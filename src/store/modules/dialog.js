/**
 * In-game alert / confirm / prompt dialogs (replaces window.alert/confirm/prompt).
 * Resolve callbacks are kept module-local so they are never serialized into state.
 */

let pendingResolve = null;

function settle(result) {
  const resolve = pendingResolve;
  pendingResolve = null;
  if (resolve) resolve(result);
}

export default {
  namespaced: true,
  state: () => ({
    open: false,
    mode: "alert", // alert | confirm | prompt
    title: "",
    message: "",
    defaultValue: "",
    value: "",
  }),
  mutations: {
    open(state, payload) {
      state.open = true;
      state.mode = payload.mode || "alert";
      state.title = payload.title || "";
      state.message = payload.message || "";
      state.defaultValue =
        payload.defaultValue !== undefined && payload.defaultValue !== null
          ? String(payload.defaultValue)
          : "";
      state.value = state.defaultValue;
    },
    setValue(state, value) {
      state.value = value;
    },
    close(state) {
      state.open = false;
      state.mode = "alert";
      state.title = "";
      state.message = "";
      state.defaultValue = "";
      state.value = "";
    },
  },
  actions: {
    alert({ commit }, { message, title = "" } = {}) {
      return new Promise(resolve => {
        pendingResolve = resolve;
        commit("open", { mode: "alert", message, title });
      });
    },
    confirm({ commit }, { message, title = "" } = {}) {
      return new Promise(resolve => {
        pendingResolve = resolve;
        commit("open", { mode: "confirm", message, title });
      });
    },
    prompt({ commit }, { message, title = "", defaultValue = "" } = {}) {
      return new Promise(resolve => {
        pendingResolve = resolve;
        commit("open", { mode: "prompt", message, title, defaultValue });
      });
    },
    submit({ commit, state }) {
      const { mode, value } = state;
      commit("close");
      if (mode === "confirm") {
        settle(true);
      } else if (mode === "prompt") {
        settle(value);
      } else {
        settle(true);
      }
    },
    cancel({ commit, state }) {
      const { mode } = state;
      commit("close");
      if (mode === "confirm") {
        settle(false);
      } else {
        settle(null);
      }
    },
  },
};
