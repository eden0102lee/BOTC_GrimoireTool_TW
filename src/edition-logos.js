// Official edition logos from the Blood on the Clocktower Wiki.
// https://wiki.bloodontheclocktower.com/Main_Page
export const OFFICIAL_EDITION_LOGOS = {
  tb: "https://wiki.bloodontheclocktower.com/images/a/a1/Logo_trouble_brewing.png",
  bmr: "https://wiki.bloodontheclocktower.com/images/1/10/Logo_bad_moon_rising.png",
  snv: "https://wiki.bloodontheclocktower.com/images/4/43/Logo_sects_and_violets.png"
};

export const CUSTOM_EDITION_LOGO =
  "https://oss.gstonegames.com/data_file/clocktower/web/editions/custom.png";

export function editionLogoUrl(edition, { imageOptIn = false } = {}) {
  if (OFFICIAL_EDITION_LOGOS[edition.id]) {
    return OFFICIAL_EDITION_LOGOS[edition.id];
  }
  if (edition.logo && imageOptIn) {
    return edition.logo;
  }
  return CUSTOM_EDITION_LOGO;
}
