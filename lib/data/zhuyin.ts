import { cacheLife } from "next/cache";
import type { Syllable } from "@/design-system/hanzi";
import { getDictionary } from "./dictionary";
import { getFlashcardCatalog, getFlashcardSet } from "./flashcards";

/** The common CJK block: leaves out the rare extension characters. */
const COMMON = /^[一-鿿]$/;

/**
 * One character for every zhuyin syllable and tone, for the zhuyin trainer.
 * The trainer is about reading the zhuyin, so each syllable gets a familiar
 * character: one from the flashcards (read in context) when there is one,
 * otherwise a common character from the dictionary.
 */
export async function getZhuyinDrill(): Promise<Syllable[]> {
  "use cache";
  cacheLife("max");
  const [{ classTopics, collections }, dictionary] = await Promise.all([
    getFlashcardCatalog(),
    getDictionary(),
  ]);
  const slugs = [...classTopics, ...collections].flatMap((group) =>
    group.sets.map((set) => set.slug),
  );
  const sets = await Promise.all(slugs.map(getFlashcardSet));

  const drill = new Map<string, Syllable>();
  const add = (syllable: Syllable) => {
    const { pinyin, zhuyin, tone } = syllable;
    if (!pinyin || !zhuyin || !tone) return;
    const key = `${zhuyin}${tone}`;
    if (!drill.has(key)) drill.set(key, syllable);
  };

  for (const set of sets) {
    for (const card of set?.cards ?? []) {
      for (const word of card.phrase.words) {
        for (const token of word.tokens) if (token.kind === "hanzi") add(token.syllable);
      }
    }
  }
  for (const [char, entry] of dictionary) {
    if (COMMON.test(char) && char === entry.trad) add(entry);
  }
  return [...drill.values()];
}
