"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { DefaultLayer, DefaultLayerMode } from "@/design-system/attributes";
import { setPreference } from "@/lib/preferences";
import { usePreference } from "./usePreference";

export type AnnotationDefaultsContextValue = {
  /** How each layer shows wherever a page doesn't set it. */
  defaults: Record<DefaultLayer, DefaultLayerMode>;
  setDefault(layer: DefaultLayer, mode: DefaultLayerMode): void;
};

export const AnnotationDefaultsContext = createContext<AnnotationDefaultsContextValue | null>(null);

const setDefault = (layer: DefaultLayer, mode: DefaultLayerMode) => setPreference(layer, mode);

/**
 * The user's default annotation layers ("hide zhuyin everywhere"). Read it
 * with useAnnotationDefaults(). Like the other preferences, the visual effect
 * is CSS on <html>; this is for the controls.
 */
export function AnnotationDefaultsProvider({ children }: { children: ReactNode }) {
  const pinyin = usePreference("pinyin");
  const zhuyin = usePreference("zhuyin");
  const english = usePreference("english");
  const value = useMemo(
    () => ({ defaults: { pinyin, zhuyin, english }, setDefault }),
    [pinyin, zhuyin, english],
  );
  return <AnnotationDefaultsContext value={value}>{children}</AnnotationDefaultsContext>;
}
