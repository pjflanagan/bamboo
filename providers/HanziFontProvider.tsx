"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { HanziFont } from "@/design-system/attributes";
import { setPreference } from "@/lib/preferences";
import { usePreference } from "./usePreference";

export type HanziFontContextValue = {
  font: HanziFont;
  setFont(font: HanziFont): void;
};

export const HanziFontContext = createContext<HanziFontContextValue | null>(null);

const setFont = (font: HanziFont) => setPreference("font", font);

/** The hanzi font preference. Read it with useHanziFont(). */
export function HanziFontProvider({ children }: { children: ReactNode }) {
  const font = usePreference("font");
  const value = useMemo(() => ({ font, setFont }), [font]);
  return <HanziFontContext value={value}>{children}</HanziFontContext>;
}
