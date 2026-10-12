import type { PhraseData } from "@/design-system/hanzi/types";

/** Lowercase, without tone marks or other accents: "Fān" -> "fan". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

const squash = (text: string) => text.replace(/\s+/g, "");

/**
 * Whether a search finds this phrase: by its hanzi (traditional or
 * simplified), its pinyin (tones and spaces optional, so "fanqie" and
 * "fān qié" both find 番茄), or its English. An empty search finds everything.
 */
export function phraseMatches(phrase: PhraseData, query: string): boolean {
  const wanted = fold(query.trim());
  if (!wanted) return true;

  const tokens = phrase.words.flatMap((word) => word.tokens);
  const written = (script: "trad" | "simp") =>
    tokens.map((token) => (token.kind === "hanzi" ? token.syllable[script] : token.text)).join("");
  const pinyin = tokens
    .map((token) => (token.kind === "hanzi" ? (token.syllable.pinyin ?? "") : token.text))
    .join("");
  const spaceless = [written("trad"), written("simp"), pinyin].map((text) => squash(fold(text)));
  if (spaceless.some((text) => text.includes(squash(wanted)))) return true;

  const english = [phrase.english, ...phrase.words.map((word) => word.english)];
  return english.some((text) => text !== undefined && fold(text).includes(wanted));
}
