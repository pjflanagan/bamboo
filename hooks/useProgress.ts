"use client";

import { progressStore, setCardProgress, setManyProgress, type ProgressMap } from "@/lib/progress";
import { useLocalStore } from "./useLocalStore";

/** Every card's progress (0 to 1) on this device, and setters by card key. */
export function useProgress(): {
  progress: ProgressMap;
  setProgress: (key: string, value: number) => void;
  setManyProgress: (values: Readonly<Record<string, number>>) => void;
} {
  return { progress: useLocalStore(progressStore), setProgress: setCardProgress, setManyProgress };
}
