import {
  mergeRules,
  getRule,
  normalizeRule,
  loadOverlayFromStorage,
  saveOverlayToStorage,
  clearOverlayStorage,
  exportRulesBundle,
  parseRulesImport,
  getBuiltinRulesMap,
  draftFromInputConfig,
} from "../roleInteractionEngine";
import { getRoleInputConfig } from "../roleInputConfig";

const state = () => ({
  overlay: loadOverlayFromStorage(),
  editorDirty: false,
});

const getters = {
  mergedRules(state) {
    return mergeRules(state.overlay);
  },
  ruleById: (state, getters) => (roleId) => {
    return getRule(roleId, state.overlay);
  },
  allRuleIds(state, getters) {
    return [...getters.mergedRules.keys()];
  },
};

const mutations = {
  setOverlay(state, overlay) {
    state.overlay = overlay || {};
    state.editorDirty = false;
  },
  upsertRule(state, rule) {
    const normalized = normalizeRule(rule);
    if (!normalized || !normalized.id) return;
    state.overlay = {
      ...state.overlay,
      [normalized.id.toLowerCase()]: normalized,
    };
    state.editorDirty = true;
  },
  removeRuleOverride(state, roleId) {
    const id = String(roleId).toLowerCase();
    const next = { ...state.overlay };
    delete next[id];
    state.overlay = next;
    state.editorDirty = true;
  },
  resetRuleToBuiltin(state, roleId) {
    const id = String(roleId).toLowerCase();
    const next = { ...state.overlay };
    delete next[id];
    state.overlay = next;
    state.editorDirty = true;
  },
  resetAllToBuiltin(state) {
    state.overlay = {};
    state.editorDirty = true;
  },
  markSaved(state) {
    state.editorDirty = false;
  },
};

const actions = {
  saveOverlay({ state, commit }) {
    saveOverlayToStorage(state.overlay);
    commit("markSaved");
  },
  loadOverlay({ commit }) {
    commit("setOverlay", loadOverlayFromStorage());
  },
  clearOverlay({ commit }) {
    clearOverlayStorage();
    commit("setOverlay", {});
  },
  importOverlay({ commit }, text) {
    const overlay = parseRulesImport(text);
    commit("setOverlay", overlay);
    saveOverlayToStorage(overlay);
    commit("markSaved");
  },
  exportOverlay({ state }) {
    return exportRulesBundle(state.overlay);
  },
  exportMerged({ state }) {
    const merged = mergeRules(state.overlay);
    const rules = [...merged.values()];
    return JSON.stringify({ version: 1, rules }, null, 2);
  },
  createDraftFromLegacy({ commit }, role) {
    const inputs = getRoleInputConfig(role);
    const draft = draftFromInputConfig(role, inputs);
    if (!draft) return null;
    commit("upsertRule", draft);
    return draft;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

export { getBuiltinRulesMap };
