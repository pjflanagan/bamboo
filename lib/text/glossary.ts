/** A run of text, and the glossary term it is, if it's one. */
export type GlossSegment = { text: string; term?: string };

/**
 * Splits text at every glossary term it contains, longest terms first, so
 * "唱歌" matches as one term rather than "唱" plus "歌".
 */
export function splitGlossary(text: string, terms: readonly string[]): GlossSegment[] {
  const sorted = terms.filter(Boolean).toSorted((a, b) => b.length - a.length);
  if (sorted.length === 0) return text ? [{ text }] : [];
  const escaped = sorted.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gu");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => (sorted.includes(part) ? { text: part, term: part } : { text: part }));
}
