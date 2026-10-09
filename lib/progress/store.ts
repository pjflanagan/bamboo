import { createLocalStore } from "@/lib/storage";
import { clampProgress, parseProgress, type ProgressMap } from "./progress";

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
