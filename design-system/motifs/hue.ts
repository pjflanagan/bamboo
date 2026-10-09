/** FNV-1a: a small, stable string hash. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Two neon hues derived from a seed: a border hue and a text hue at least 80°
 * away from it, as in study-mandarin's random signs. Deterministic, so the
 * server and client agree and a heading keeps its colors across reloads.
 */
export function seededHues(seed: string): { hue: number; textHue: number } {
  const h = hash(seed);
  const hue = h % 360;
  const textHue = (hue + 80 + ((h >>> 9) % 201)) % 360;
  return { hue, textHue };
}
