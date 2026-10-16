"use client";

import type { ReactNode } from "react";
import { HanziFontProvider } from "./HanziFontProvider";
import { PreferencesSync } from "./PreferencesSync";
import { ScriptProvider } from "./ScriptProvider";
import { ServiceWorker } from "./ServiceWorker";
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
          <PreferencesSync />
          <ServiceWorker />
          {children}
        </HanziFontProvider>
      </ScriptProvider>
    </ThemeProvider>
  );
}
