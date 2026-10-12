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

/** How many times more often a starred card comes up than it otherwise would. */
export const STAR_BOOST = 3;

/** Starred cards, by the same key as progress. Keeps only strings, each once. */
export function parseStars(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((key): key is string => typeof key === "string"))];
}

/** The zhuyin symbols in a syllable's spelling, each once: "ㄇㄚ" -> ["ㄇ", "ㄚ"]. */
export function zhuyinSymbols(zhuyin: string): string[] {
  return [...new Set(zhuyin)];
}

/** A syllable's progress: the average of its symbols' progress. */
export function syllableProgress(zhuyin: string, progress: ProgressMap): number {
  const symbols = zhuyinSymbols(zhuyin);
  if (symbols.length === 0) return 0;
  return symbols.reduce((sum, symbol) => sum + (progress[symbol] ?? 0), 0) / symbols.length;
}

/**
 * How likely a card is to come up next, relative to the others. New cards
 * weigh 1.05, half-known 0.3, known 0.05: known cards still come back, about
 * one-twentieth as often as new ones. A star multiplies whatever that is.
 */
export function weightOf(progress: number, starred = false): number {
  return (0.05 + (1 - clampProgress(progress)) ** 2) * (starred ? STAR_BOOST : 1);
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
  return pickWeighted(
    progress.map((p) => weightOf(p)),
    current,
    random,
  );
}

/** pickNext for weights worked out by the caller: cards that can be starred. */
export function pickWeighted(
  cardWeights: readonly number[],
  current?: number,
  random: () => number = Math.random,
): number {
  if (cardWeights.length <= 1) return 0;
  const weights = cardWeights.map((w, i) => (i === current ? 0 : w));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let target = random() * total;
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target < 0 && weights[i] > 0) return i;
  }
  // Floating-point leftovers: the last card that could be picked.
  return weights.findLastIndex((w) => w > 0);
}
