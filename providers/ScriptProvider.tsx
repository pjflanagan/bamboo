"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { Script } from "@/design-system/attributes";
import { setPreference } from "@/lib/preferences";
import { usePreference } from "./usePreference";

export type ScriptContextValue = {
  /** Traditional or simplified characters. */
  script: Script;
  setScript(script: Script): void;
};

export const ScriptContext = createContext<ScriptContextValue | null>(null);

const setScript = (script: Script) => setPreference("script", script);

/**
 * Traditional/simplified preference. Read it with useScript().
 *
 * Rendering doesn't need it: every syllable carries both forms and CSS shows
 * the right one from data-script. Use it for logic that must know, such as
 * search input or text-to-speech.
 */
export function ScriptProvider({ children }: { children: ReactNode }) {
  const script = usePreference("script");
  const value = useMemo(() => ({ script, setScript }), [script]);
  return <ScriptContext value={value}>{children}</ScriptContext>;
}
