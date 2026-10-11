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
  HANZI_FONTS,
  SCRIPTS,
  THEMES,
  THEME_DEFAULT_FONTS,
  type HanziFont,
  type Script,
  type Theme,
} from "@/design-system/attributes";

/** "system" follows the OS light/dark setting: dark -> neon, light -> bamboo. */
export const THEME_PREFS = [...THEMES, "system"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];

export type Preferences = {
  theme: ThemePref;
  /**
   * The hanzi font, remembered per theme: bamboo starts on WenKai and neon
   * on Sans, and picking a font changes it only for the theme in use.
   */
  fonts: Record<Theme, HanziFont>;
  script: Script;
};

/**
 * Theme the static HTML is rendered with, before the inline script runs,
 * and the theme until the user picks another.
 */
export const DEFAULT_THEME: Theme = "bamboo";

export const DEFAULT_PREFERENCES: Preferences = {
  theme: DEFAULT_THEME,
  fonts: THEME_DEFAULT_FONTS,
  script: "trad",
};

export const PREFERENCES_COOKIE = "bamboo-prefs";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Parses the cookie value, dropping anything unknown. Never throws. */
export function parsePreferences(raw: string | undefined | null): Preferences {
  let data: unknown = {};
  try {
    if (raw) data = JSON.parse(decodeURIComponent(raw));
  } catch {
    // malformed cookie: fall back to defaults
  }
  return normalizePreferences(data);
}

/** Preferences from an untrusted object, with defaults for anything unknown. */
export function normalizePreferences(raw: unknown): Preferences {
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const fonts = (data.fonts ?? {}) as Record<string, unknown>;
  return {
    theme: pick(THEME_PREFS, data.theme, DEFAULT_PREFERENCES.theme),
    fonts: {
      neon: pick(HANZI_FONTS, fonts.neon, THEME_DEFAULT_FONTS.neon),
      bamboo: pick(HANZI_FONTS, fonts.bamboo, THEME_DEFAULT_FONTS.bamboo),
    },
    script: pick(SCRIPTS, data.script, DEFAULT_PREFERENCES.script),
  };
}

export function serializePreferencesCookie(prefs: Preferences): string {
  const value = encodeURIComponent(JSON.stringify(prefs));
  return `${PREFERENCES_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * A random base hue for the page's <Sign> headings, new on every load as in
 * study-mandarin. Each sign offsets it by an amount derived from its text,
 * so headings differ from each other and all change on reload. Nothing else
 * uses it: the rest of neon keeps its fixed accent.
 */
export function randomSignHue(random: () => number = Math.random): number {
  return Math.floor(random() * 360);
}

/** randomSignHue as ES5 for the inline script, applied to <html> (d). */
const SIGN_HUE_JS = `d.style.setProperty("--random-hue",String(Math.floor(Math.random()*360)));`;

/**
 * Sets the random sign hue on <html> unless it's already set: the inline
 * script runs first, and this covers a dev Strict Mode remount clearing it.
 */
export function ensureSignHue(root: HTMLElement): void {
  if (root.style.getPropertyValue("--random-hue")) return;
  root.style.setProperty("--random-hue", String(randomSignHue()));
}

/**
 * Inline <head> script that applies the saved preferences to <html> while the
 * HTML is still parsing, so the first paint already has the right theme and
 * fonts. Mirrors parsePreferences + resolveTheme; kept to ES5 on purpose.
 */
export const PREFERENCES_SCRIPT = `(function(){try{
var d=document.documentElement,p={},m=document.cookie.match(/(?:^|; )${PREFERENCES_COOKIE}=([^;]*)/);
if(m){p=JSON.parse(decodeURIComponent(m[1]))||{}}
var t=p.theme;if(${JSON.stringify(THEMES)}.indexOf(t)<0){t=t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches?"neon":${JSON.stringify(DEFAULT_THEME)}}
d.setAttribute("data-theme",t);
var f=p.fonts&&p.fonts[t];if(${JSON.stringify(HANZI_FONTS)}.indexOf(f)<0){f=${JSON.stringify(THEME_DEFAULT_FONTS)}[t]}
d.setAttribute("data-hanzi-font",f);
if(${JSON.stringify(SCRIPTS)}.indexOf(p.script)>=0)d.setAttribute("data-script",p.script);
${SIGN_HUE_JS}
}catch(e){}})()`.replace(/\n/g, "");
