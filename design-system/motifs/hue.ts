import type { CSSProperties } from "react";

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

/**
 * Props that give an element its own neon color: the page's random hue
 * turned by an offset derived from `seed`, like a sign's (tokens/neon.css).
 * Spread onto the element; it does nothing in bamboo.
 */
export function hueScope(seed: string): { "data-hue": ""; style: CSSProperties } {
  return { "data-hue": "", style: { "--hue-offset": seededHues(seed).hue } as CSSProperties };
}
