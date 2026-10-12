"use client";

import { useState } from "react";
import { SetChooser, findSet } from "@/components/flashcards";
import { Card } from "@/design-system/controls";
import { useChosenSet, useFlashcardSet } from "@/hooks";
import type { FlashcardCatalog } from "@/lib/data";
import { FlashcardDeck, type Mode } from "./FlashcardDeck";
import { ModeButton } from "./ModeButton";
import styles from "./FlashcardStudy.module.css";

/**
 * The whole flashcards page below the header: the set chooser and mode, then
 * the deck. The page is static; the chosen set's cards load from
 * /api/flashcards/<slug> (static JSON) when it's picked.
 */
export function FlashcardStudy({ catalog }: { catalog: FlashcardCatalog }) {
  const [saved, choose] = useChosenSet();
  // A saved set that's no longer in the catalog counts as none.
  const slug = saved === undefined ? undefined : (findSet(catalog, saved)?.slug ?? null);
  const state = useFlashcardSet(slug);
  const [mode, setMode] = useState<Mode>("hanzi");

  return (
    <div className={styles.study}>
      <div className={styles.bar}>
        <SetChooser catalog={catalog} slug={slug} onSelect={choose} />
        <ModeButton mode={mode} onChange={setMode} />
      </div>

      {state.status === "ready" ? (
        <FlashcardDeck key={state.set.slug} cards={state.set.cards} mode={mode} />
      ) : (
        <Card className={styles.placeholder} aria-busy={state.status === "loading"}>
          <p className={state.status === "loading" ? styles.loading : undefined}>
            {slug === null
              ? "Pick a set to start studying."
              : state.status === "error"
                ? "Couldn't load this set. Pick another above."
                : "Loading…"}
          </p>
        </Card>
      )}
    </div>
  );
}
