"use client";

import { use } from "react";
import {
  AnnotationDefaultsContext,
  type AnnotationDefaultsContextValue,
} from "@/providers/AnnotationDefaultsProvider";

/** The user's default annotation layers and a setter. */
export function useAnnotationDefaults(): AnnotationDefaultsContextValue {
  const value = use(AnnotationDefaultsContext);
  if (!value) throw new Error("useAnnotationDefaults must be used inside <AppProviders>");
  return value;
}
