"use client";

import { useSyncExternalStore } from "react";
import { getPreferences, SERVER_STATE, subscribe, type PreferencesState } from "@/lib/preferences";

/**
 * One field of the preferences store. Selecting a single field means a
 * provider only updates when its own preference changes.
 *
 * Hydration renders the server default, then the saved value. The page itself
 * is already correct before that (the inline script set <html> attributes);
 * only controls showing the current choice see the switch.
 */
export function usePreference<K extends keyof PreferencesState>(key: K): PreferencesState[K] {
  return useSyncExternalStore(
    subscribe,
    () => getPreferences()[key],
    () => SERVER_STATE[key],
  );
}
