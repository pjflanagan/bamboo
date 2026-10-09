"use client";

import { use } from "react";
import { ScriptContext, type ScriptContextValue } from "@/providers/ScriptProvider";

/** Traditional/simplified preference and a setter. */
export function useScript(): ScriptContextValue {
  const value = use(ScriptContext);
  if (!value) throw new Error("useScript must be used inside <AppProviders>");
  return value;
}
