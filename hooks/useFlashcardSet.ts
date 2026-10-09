"use client";

import { useEffect, useState } from "react";
import type { FlashcardSet } from "@/lib/data";

type Loaded = { slug: string; set: FlashcardSet } | { slug: string; error: true };

export type FlashcardSetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; set: FlashcardSet };

/** Loads a set's cards from /api/flashcards/<slug> (static JSON). */
export function useFlashcardSet(slug: string | null | undefined): FlashcardSetState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/flashcards/${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<FlashcardSet>;
      })
      .then(
        (set) => !cancelled && setLoaded({ slug, set }),
        () => !cancelled && setLoaded({ slug, error: true }),
      );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) return { status: "idle" };
  if (loaded?.slug !== slug) return { status: "loading" };
  return "set" in loaded ? { status: "ready", set: loaded.set } : { status: "error" };
}
