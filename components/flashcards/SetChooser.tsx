"use client";

import { useState } from "react";
import { Button } from "@/design-system/controls";
import { ChevronDownIcon } from "@/design-system/icons";
import type { FlashcardCatalog, FlashcardSetInfo } from "@/lib/data";
import { SetPicker } from "./SetPicker";
import styles from "./SetChooser.module.css";

/** The catalog entry for a slug, if it's still in the catalog. */
export function findSet(catalog: FlashcardCatalog, slug: string | null | undefined) {
  if (!slug) return undefined;
  return [...catalog.classTopics, ...catalog.collections]
    .flatMap((group): FlashcardSetInfo[] => group.sets)
    .find((set) => set.slug === slug);
}

type SetChooserProps = {
  catalog: FlashcardCatalog;
  /** undefined while hydrating, null when no set is chosen. */
  slug: string | null | undefined;
  onSelect: (slug: string) => void;
};

/**
 * A button naming the current set that opens the set picker. With no set
 * chosen, the picker opens by itself (until it's closed by hand).
 */
export function SetChooser({ catalog, slug, onSelect }: SetChooserProps) {
  // null: not yet opened or closed by hand, so it opens while no set is chosen.
  const [choice, setOpen] = useState<boolean | null>(null);
  const open = choice ?? slug === null;
  const info = findSet(catalog, slug);

  return (
    <>
      <Button
        size="sm"
        className={styles.button}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className={styles.name}>{info?.title ?? "Choose a set"}</span>
        <ChevronDownIcon size={14} />
      </Button>
      <SetPicker
        open={open}
        onClose={() => setOpen(false)}
        catalog={catalog}
        current={info?.slug ?? null}
        onSelect={onSelect}
      />
    </>
  );
}
