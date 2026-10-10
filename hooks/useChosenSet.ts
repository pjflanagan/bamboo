"use client";

import { useSyncExternalStore } from "react";
import { chosenSetStore as chosenSet } from "@/lib/storage";

/**
 * The chosen set's slug: undefined until hydrated (so a returning visitor
 * never flashes "Choose a set"), then the slug or null.
 */
export function useChosenSet(): [string | null | undefined, (slug: string) => void] {
  const slug = useSyncExternalStore(chosenSet.subscribe, chosenSet.get, () => undefined);
  return [slug, chosenSet.set];
}
