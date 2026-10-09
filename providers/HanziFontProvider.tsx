"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { HanziFont } from "@/design-system/attributes";
import { setHanziFont } from "@/lib/preferences";
import { usePreference } from "./usePreference";

export type HanziFontContextValue = {
  font: HanziFont;
  setFont(font: HanziFont): void;
};

export const HanziFontContext = createContext<HanziFontContextValue | null>(null);

/**
 * The hanzi font shown, which follows the theme (each theme remembers its
 * own). setFont changes it for the current theme. Read it with useHanziFont().
 */
export function HanziFontProvider({ children }: { children: ReactNode }) {
  const font = usePreference("font");
  const value = useMemo(() => ({ font, setFont: setHanziFont }), [font]);
  return <HanziFontContext value={value}>{children}</HanziFontContext>;
}
