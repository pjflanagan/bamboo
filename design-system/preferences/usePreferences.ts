"use client";

import { useSyncExternalStore } from "react";
import { SERVER_STATE, getPreferences, setPreference, subscribe } from "./store";

/**
 * Current preferences plus a setter. Only controls (toggles, menus) need
 * this; anything visual should rely on the <html> data attributes via CSS.
 *
 * During hydration this returns the defaults, then the saved values on the
 * next render, so controls may briefly show the default selection. The page
 * itself is already correct from the inline script.
 */
export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, getPreferences, () => SERVER_STATE);
  return { ...preferences, setPreference };
}
