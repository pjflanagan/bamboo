/*
 * How well each card is known, from 0 (new) to 1 (known). Keyed by the
 * phrase as written, so a word shared by two sets shares its progress.
 */

export type ProgressMap = Readonly<Record<string, number>>;

/** What +/- move a card's progress by. */
export const PROGRESS_STEP = 0.1;

/** Clamped to 0..1 and rounded to hundredths, so repeated steps don't drift. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}

/** Keeps only numeric entries; anything else in storage is dropped. */
export function parseProgress(raw: unknown): ProgressMap {
  if (typeof raw !== "object" || raw === null) return {};
  const map: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number") map[key] = clampProgress(value);
  }
  return map;
}

/**
 * How likely a card is to come up next, relative to the others. New cards
 * weigh 1.05, half-known 0.3, known 0.05: known cards still come back, about
 * one-twentieth as often as new ones.
 */
export function weightOf(progress: number): number {
  return 0.05 + (1 - clampProgress(progress)) ** 2;
}

/**
 * Index of the next card, chosen at random weighted toward lesser-known
 * cards. Never repeats `current` unless it's the only card.
 */
export function pickNext(
  progress: readonly number[],
  current?: number,
  random: () => number = Math.random,
): number {
  if (progress.length <= 1) return 0;
  const weights = progress.map((p, i) => (i === current ? 0 : weightOf(p)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let target = random() * total;
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target < 0 && weights[i] > 0) return i;
  }
  // Floating-point leftovers: the last card that could be picked.
  return weights.findLastIndex((w) => w > 0);
}
