/*
 * The theme, as on the site (design-system/tokens): Bamboo (light) or Neon
 * (dark), or System, which follows the OS: dark -> Neon, light -> Bamboo.
 * Loaded in <head> so the first paint already has the right theme; the
 * choice is kept in this extension's localStorage, which is synchronous.
 */

const THEME_KEY = "bamboo-theme";
const THEME_PREFS = ["bamboo", "neon", "system"];
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function getThemePref() {
  try {
    const pref = localStorage.getItem(THEME_KEY);
    return THEME_PREFS.includes(pref) ? pref : "system";
  } catch {
    return "system";
  }
}

function applyTheme(pref = getThemePref()) {
  const root = document.documentElement;
  root.dataset.theme = pref === "system" ? (darkQuery.matches ? "neon" : "bamboo") : pref;
  root.dataset.themePref = pref;
}

function setThemePref(pref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // storage unavailable: the theme lasts for this tab only
  }
  applyTheme(pref);
}

applyTheme();
darkQuery.addEventListener("change", () => applyTheme());
// A theme picked in another new tab.
window.addEventListener("storage", (event) => event.key === THEME_KEY && applyTheme());
