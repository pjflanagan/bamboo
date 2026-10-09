"use client";

import type { ReactNode } from "react";
import { TouchReveal } from "@/design-system/hanzi";
import { AnnotationDefaultsProvider } from "./AnnotationDefaultsProvider";
import { HanziFontProvider } from "./HanziFontProvider";
import { PreferencesSync } from "./PreferencesSync";
import { ScriptProvider } from "./ScriptProvider";
import { ThemeProvider } from "./ThemeProvider";

/**
 * Every app-level provider, in one place. The root layout renders this once
 * around the whole app. New app-wide state (study progress, offline status)
 * gets its provider added here.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ScriptProvider>
        <HanziFontProvider>
          <AnnotationDefaultsProvider>
            <PreferencesSync />
            <TouchReveal />
            {children}
          </AnnotationDefaultsProvider>
        </HanziFontProvider>
      </ScriptProvider>
    </ThemeProvider>
  );
}
