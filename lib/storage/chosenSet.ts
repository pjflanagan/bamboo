import { createLocalStore } from "./localStore";

/** The flashcard set last chosen, shared by the flashcards and sets pages. */
export const chosenSetStore = createLocalStore<string | null>(
  "bamboo-flashcard-set",
  (raw) => (typeof raw === "string" ? raw : null),
  null,
);
