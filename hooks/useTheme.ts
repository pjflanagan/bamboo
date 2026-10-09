"use client";

import { use } from "react";
import { ThemeContext, type ThemeContextValue } from "@/providers/ThemeProvider";

/** The current theme preference, the resolved theme, and a setter. */
export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <AppProviders>");
  return value;
}
