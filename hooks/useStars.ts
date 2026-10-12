"use client";

import { useMemo } from "react";
import { starStore, toggleStar } from "@/lib/progress";
import { useLocalStore } from "./useLocalStore";

/** The cards starred on this device, by card key, and a toggle. */
export function useStars(): {
  starred: ReadonlySet<string>;
  toggleStar: (key: string) => void;
} {
  const stars = useLocalStore(starStore);
  const starred = useMemo(() => new Set(stars), [stars]);
  return { starred, toggleStar };
}
