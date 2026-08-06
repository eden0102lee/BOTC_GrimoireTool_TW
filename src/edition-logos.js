// Official English edition logos (BOTC Wiki).
// Temporarily only TB / BMR / SNV are offered in the picker.

export const OFFICIAL_EDITION_LOGOS = {
  tb: "https://wiki.bloodontheclocktower.com/images/a/a1/Logo_trouble_brewing.png",
  bmr: "https://wiki.bloodontheclocktower.com/images/1/10/Logo_bad_moon_rising.png",
  snv: "https://wiki.bloodontheclocktower.com/images/4/43/Logo_sects_and_violets.png"
};

// Fallback for custom scripts / unknown editions in the town center.
export const CUSTOM_EDITION_LOGO = require("./assets/editions/custom.png");

export function editionLogoUrl(edition, { imageOptIn = false } = {}) {
  if (edition && OFFICIAL_EDITION_LOGOS[edition.id]) {
    return OFFICIAL_EDITION_LOGOS[edition.id];
  }
  if (edition && edition.logo && imageOptIn) {
    return edition.logo;
  }
  return CUSTOM_EDITION_LOGO;
}
