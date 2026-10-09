"use client";

import { useLayoutEffect } from "react";
import { applyPreferences, subscribe } from "@/lib/preferences";

/**
 * Keeps <html> in sync with the saved preferences after hydration:
 * - re-applies attributes that React Strict Mode clears on its dev remount
 * - follows OS light/dark changes while the theme preference is "system"
 *
 * Rendered once by AppProviders. Renders nothing.
 */
export function PreferencesSync() {
  useLayoutEffect(() => {
    applyPreferences();
    return subscribe(() => {});
  }, []);
  return null;
}
