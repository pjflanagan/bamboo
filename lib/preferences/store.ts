/*
 * Client-side preferences store. The cookie is the source of truth; this
 * module caches it, writes it, and mirrors it onto <html> attributes.
 * Components don't use it directly: providers/ wraps it in React context.
 */

import { THEME_COLORS, type HanziFont, type Theme } from "@/design-system/attributes";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_THEME,
  PREFERENCES_COOKIE,
  ensureSignHue,
  parsePreferences,
  serializePreferencesCookie,
  type Preferences,
} from "./preferences";

export type PreferencesState = Preferences & {
  /** The theme actually shown: "system" resolved against the OS setting. */
  resolvedTheme: Theme;
  /** The hanzi font shown: the resolved theme's entry in `fonts`. */
  font: HanziFont;
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

export const SERVER_STATE: PreferencesState = {
  ...DEFAULT_PREFERENCES,
  resolvedTheme: DEFAULT_THEME,
  font: DEFAULT_PREFERENCES.fonts[DEFAULT_THEME],
};

let state: PreferencesState | null = null;
const listeners = new Set<() => void>();

function readCookie(): Preferences {
  const match = document.cookie.match(new RegExp(`(?:^|; )${PREFERENCES_COOKIE}=([^;]*)`));
  return parsePreferences(match?.[1]);
}

function resolve(prefs: Preferences): PreferencesState {
  const resolvedTheme =
    prefs.theme === "system" ? (matchMedia(DARK_QUERY).matches ? "neon" : "bamboo") : prefs.theme;
  return { ...prefs, resolvedTheme, font: prefs.fonts[resolvedTheme] };
}

/** Writes the current state onto <html> and the browser theme-color. */
export function applyPreferences(): void {
  const preferences = getPreferences();
  const root = document.documentElement;
  root.setAttribute("data-theme", preferences.resolvedTheme);
  root.setAttribute("data-hanzi-font", preferences.font);
  root.setAttribute("data-script", preferences.script);
  ensureSignHue(root);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[preferences.resolvedTheme]));
}

function update(next: PreferencesState): void {
  state = next;
  applyPreferences();
  listeners.forEach((listener) => listener());
}

export function getPreferences(): PreferencesState {
  if (!state) state = resolve(readCookie());
  return state;
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  const { theme, fonts, script } = getPreferences();
  setPreferences({ theme, fonts, script, [key]: value });
}

/** Replaces every preference at once: restoring a backup. */
export function setPreferences(next: Preferences): void {
  document.cookie = serializePreferencesCookie(next);
  update(resolve(next));
}

/** Sets the hanzi font for the theme currently shown. */
export function setHanziFont(font: HanziFont): void {
  const { fonts, resolvedTheme } = getPreferences();
  setPreference("fonts", { ...fonts, [resolvedTheme]: font });
}

function onSystemThemeChange(): void {
  const current = getPreferences();
  if (current.theme === "system") update(resolve(current));
}

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    matchMedia(DARK_QUERY).addEventListener("change", onSystemThemeChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      matchMedia(DARK_QUERY).removeEventListener("change", onSystemThemeChange);
    }
  };
}
