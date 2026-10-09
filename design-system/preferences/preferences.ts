/*
 * User display preferences. Shared by the server (defaults, inline script)
 * and the client (store). Pure: no DOM or Next APIs here.
 *
 * Every preference is applied as a data attribute on <html> and all of its
 * visual effects are CSS. Pages never read preferences to decide what to
 * render, which keeps every route statically prerenderable.
 */

export const THEME_PREFS = ["system", "neon", "bamboo"] as const;
export const THEMES = ["neon", "bamboo"] as const;
export const HANZI_FONTS = ["sans", "serif", "wenkai", "iansui"] as const;
export const SCRIPTS = ["trad", "simp"] as const;

export type ThemePref = (typeof THEME_PREFS)[number];
export type Theme = (typeof THEMES)[number];
export type HanziFont = (typeof HANZI_FONTS)[number];
export type Script = (typeof SCRIPTS)[number];

export type Preferences = {
  theme: ThemePref;
  font: HanziFont;
  script: Script;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  font: "sans",
  script: "trad",
};

/** Theme the static HTML is rendered with, before the inline script runs. */
export const DEFAULT_THEME: Theme = "bamboo";

export const PREFERENCES_COOKIE = "bamboo-prefs";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const HANZI_FONT_LABELS: Record<HanziFont, string> = {
  sans: "Sans",
  serif: "Serif",
  wenkai: "WenKai",
  iansui: "Iansui",
};

/** Background color per theme, for the browser UI (<meta name="theme-color">). */
export const THEME_COLORS: Record<Theme, string> = {
  neon: "#1c1c1c",
  bamboo: "#f5f2ee",
};

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Parses the cookie value, dropping anything unknown. Never throws. */
export function parsePreferences(raw: string | undefined | null): Preferences {
  let data: Record<string, unknown> = {};
  try {
    if (raw) data = JSON.parse(decodeURIComponent(raw)) ?? {};
  } catch {
    // malformed cookie: fall back to defaults
  }
  return {
    theme: pick(THEME_PREFS, data.theme, DEFAULT_PREFERENCES.theme),
    font: pick(HANZI_FONTS, data.font, DEFAULT_PREFERENCES.font),
    script: pick(SCRIPTS, data.script, DEFAULT_PREFERENCES.script),
  };
}

export function serializePreferencesCookie(prefs: Preferences): string {
  const value = encodeURIComponent(JSON.stringify(prefs));
  return `${PREFERENCES_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Inline <head> script that applies the saved preferences to <html> while the
 * HTML is still parsing, so the first paint already has the right theme and
 * fonts. Mirrors parsePreferences + resolveTheme; kept to ES5 on purpose.
 */
export const PREFERENCES_SCRIPT = `(function(){try{
var d=document.documentElement,p={},m=document.cookie.match(/(?:^|; )${PREFERENCES_COOKIE}=([^;]*)/);
if(m){p=JSON.parse(decodeURIComponent(m[1]))||{}}
var t=p.theme;if(${JSON.stringify(THEMES)}.indexOf(t)<0){t=matchMedia("(prefers-color-scheme: dark)").matches?"neon":"bamboo"}
d.setAttribute("data-theme",t);
if(${JSON.stringify(HANZI_FONTS)}.indexOf(p.font)>=0)d.setAttribute("data-hanzi-font",p.font);
if(${JSON.stringify(SCRIPTS)}.indexOf(p.script)>=0)d.setAttribute("data-script",p.script);
}catch(e){}})()`.replace(/\n/g, "");
