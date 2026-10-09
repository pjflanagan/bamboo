"use client";

import { use } from "react";
import { HanziFontContext, type HanziFontContextValue } from "@/providers/HanziFontProvider";

/** The hanzi font preference and a setter. */
export function useHanziFont(): HanziFontContextValue {
  const value = use(HanziFontContext);
  if (!value) throw new Error("useHanziFont must be used inside <AppProviders>");
  return value;
}
