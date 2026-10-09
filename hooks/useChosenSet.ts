"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/storage";

/** The flashcard set last chosen, shared by the flashcards and sets pages. */
const chosenSet = createLocalStore<string | null>(
  "bamboo-flashcard-set",
  (raw) => (typeof raw === "string" ? raw : null),
  null,
);

/**
 * The chosen set's slug: undefined until hydrated (so a returning visitor
 * never flashes "Choose a set"), then the slug or null.
 */
export function useChosenSet(): [string | null | undefined, (slug: string) => void] {
  const slug = useSyncExternalStore(chosenSet.subscribe, chosenSet.get, () => undefined);
  return [slug, chosenSet.set];
}
