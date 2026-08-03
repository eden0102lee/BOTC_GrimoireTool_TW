import zh_TW from "./zh_TW";

export function t(key, params = {}) {
  let str = zh_TW[key];
  if (!str) return key;
  Object.keys(params).forEach(k => {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), params[k]);
  });
  return str;
}

export function editionName(edition) {
  if (!edition) return "";
  const localized = t(`edition.${edition.id}`);
  return localized.startsWith("edition.") ? edition.name : localized;
}

export function teamName(team) {
  const localized = t(`team.${team}`);
  return localized.startsWith("team.") ? team : localized;
}

export default {
  install(Vue) {
    Vue.prototype.$t = t;
    Vue.prototype.$editionName = editionName;
    Vue.prototype.$teamName = teamName;
  }
};
