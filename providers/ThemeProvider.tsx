"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { Theme } from "@/design-system/attributes";
import { setPreference, type ThemePref } from "@/lib/preferences";
import { usePreference } from "./usePreference";

export type ThemeContextValue = {
  /** The user's choice, including "system". */
  theme: ThemePref;
  /** The theme on screen: "system" resolved against the OS setting. */
  resolvedTheme: Theme;
  setTheme(theme: ThemePref): void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const setTheme = (theme: ThemePref) => setPreference("theme", theme);

/** Light/dark theme. Read it with useTheme(). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = usePreference("theme");
  const resolvedTheme = usePreference("resolvedTheme");
  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
