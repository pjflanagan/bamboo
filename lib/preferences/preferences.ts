/*
 * User display preferences and how they persist (a cookie). Shared by the
 * server (defaults, inline script) and the client (store). Pure: no DOM or
 * Next APIs here. The values themselves are the design system's attribute
 * contract (design-system/attributes.ts).
 *
 * Every preference is applied as a data attribute on <html> and all of its
 * visual effects are CSS. Pages never read preferences to decide what to
 * render, which keeps every route statically prerenderable.
 */

import {
  DEFAULT_LAYERS,
  DEFAULT_LAYER_MODES,
  HANZI_FONTS,
  SCRIPTS,
  THEMES,
  type DefaultLayerMode,
  type HanziFont,
  type Script,
  type Theme,
} from "@/design-system/attributes";

/** "system" follows the OS light/dark setting: dark -> neon, light -> bamboo. */
export const THEME_PREFS = ["system", ...THEMES] as const;
export type ThemePref = (typeof THEME_PREFS)[number];

export type Preferences = {
  theme: ThemePref;
  font: HanziFont;
  script: Script;
  /** Default annotation layers, where no AnnotationScope sets them. */
  pinyin: DefaultLayerMode;
  zhuyin: DefaultLayerMode;
  english: DefaultLayerMode;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  font: "sans",
  script: "trad",
  pinyin: "shown",
  zhuyin: "shown",
  english: "shown",
};

/** Theme the static HTML is rendered with, before the inline script runs. */
export const DEFAULT_THEME: Theme = "bamboo";

export const PREFERENCES_COOKIE = "bamboo-prefs";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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
    pinyin: pick(DEFAULT_LAYER_MODES, data.pinyin, DEFAULT_PREFERENCES.pinyin),
    zhuyin: pick(DEFAULT_LAYER_MODES, data.zhuyin, DEFAULT_PREFERENCES.zhuyin),
    english: pick(DEFAULT_LAYER_MODES, data.english, DEFAULT_PREFERENCES.english),
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
${JSON.stringify(DEFAULT_LAYERS)}.forEach(function(l){if(${JSON.stringify(DEFAULT_LAYER_MODES)}.indexOf(p[l])>=0)d.setAttribute("data-default-"+l,p[l])});
}catch(e){}})()`.replace(/\n/g, "");
