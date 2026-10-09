/*
 * Client-side preferences store. The cookie is the source of truth; this
 * module caches it, writes it, and mirrors it onto <html> attributes.
 * Components don't use it directly: providers/ wraps it in React context.
 */

import { THEME_COLORS, type Theme } from "@/design-system/attributes";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_THEME,
  PREFERENCES_COOKIE,
  parsePreferences,
  serializePreferencesCookie,
  type Preferences,
} from "./preferences";

export type PreferencesState = Preferences & {
  /** The theme actually shown: "system" resolved against the OS setting. */
  resolvedTheme: Theme;
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

export const SERVER_STATE: PreferencesState = {
  ...DEFAULT_PREFERENCES,
  resolvedTheme: DEFAULT_THEME,
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
  return { ...prefs, resolvedTheme };
}

/** Writes the current state onto <html> and the browser theme-color. */
export function applyPreferences(): void {
  const { resolvedTheme, font, script } = getPreferences();
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedTheme);
  root.setAttribute("data-hanzi-font", font);
  root.setAttribute("data-script", script);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[resolvedTheme]));
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
  const { theme, font, script } = getPreferences();
  const next: Preferences = { theme, font, script, [key]: value };
  document.cookie = serializePreferencesCookie(next);
  update(resolve(next));
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
