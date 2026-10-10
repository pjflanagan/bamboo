import { createLocalStore } from "@/lib/storage";
import { clampProgress, parseProgress, zhuyinSymbols, type ProgressMap } from "./progress";

/** Every card's progress on this device. */
export const progressStore = createLocalStore<ProgressMap>("bamboo-progress", parseProgress, {});

export function setCardProgress(key: string, value: number): void {
  progressStore.set({ ...progressStore.get(), [key]: clampProgress(value) });
}

/** Sets several cards at once, in one write: resetting a set. */
export function setManyProgress(values: Readonly<Record<string, number>>): void {
  const next = { ...progressStore.get() };
  for (const [key, value] of Object.entries(values)) next[key] = clampProgress(value);
  progressStore.set(next);
}

/**
 * Each zhuyin symbol's progress, from the zhuyin trainer and shown on the
 * chart. Kept apart from card progress: its keys are single symbols.
 */
export const zhuyinProgressStore = createLocalStore<ProgressMap>(
  "bamboo-zhuyin-progress",
  parseProgress,
  {},
);

/** Moves every symbol in a syllable's zhuyin by `delta`, in one write. */
export function adjustZhuyinProgress(zhuyin: string, delta: number): void {
  const next = { ...zhuyinProgressStore.get() };
  for (const symbol of zhuyinSymbols(zhuyin)) {
    next[symbol] = clampProgress((next[symbol] ?? 0) + delta);
  }
  zhuyinProgressStore.set(next);
}
