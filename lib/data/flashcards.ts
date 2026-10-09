import { cacheLife, cacheTag } from "next/cache";
import Papa from "papaparse";
import { isCardColor, type CardColor } from "@/design-system/controls";
import type { PhraseData } from "@/design-system/hanzi";
import { tokenize } from "@/lib/hanzi";
import { getDictionary } from "./dictionary";
import { DATA_TAG, readDataFile } from "./files";

/** One flashcard set: a CSV under data/flashcards. */
export type FlashcardSetInfo = {
  /** URL segment: /flashcards/<slug>. */
  slug: string;
  title: string;
  /** Path under data/flashcards. */
  file: string;
  description?: string;
};

/** Class sets come numbered by topic: Basics 1, 2, 3. */
export type FlashcardTopic = {
  title: string;
  sets: FlashcardSetInfo[];
};

export type FlashcardCollection = {
  title: string;
  sets: FlashcardSetInfo[];
};

export type FlashcardCatalog = {
  classTopics: FlashcardTopic[];
  collections: FlashcardCollection[];
};

export type Flashcard = {
  /** Stable within a set: the row number. */
  id: string;
  /** The phrase as written, for links out (translate). */
  text: string;
  phrase: PhraseData;
  color?: CardColor;
};

export type FlashcardSet = FlashcardSetInfo & { cards: Flashcard[] };

/*
 * Sets outside class/ aren't in flashcard-sets.json yet, so they're listed
 * here, as study-mandarin's set picker listed them. The generated manifest
 * (step 6) replaces this list.
 */
const COLLECTIONS: FlashcardCollection[] = [
  {
    title: "Structures",
    sets: [
      { slug: "structures", title: "Structures", file: "unit/structures/structures.csv" },
      { slug: "x-bu-y", title: "X 不 Y", file: "unit/structures/x_bu_y.csv" },
      { slug: "zai", title: "在...", file: "unit/structures/zai.csv" },
    ],
  },
  {
    title: "Unsorted",
    sets: [
      { slug: "measure-words", title: "Measure words", file: "unit/measure_words.csv" },
      { slug: "chengyu", title: "成語 · Idioms", file: "unit/chengyu.csv" },
    ],
  },
  {
    title: "Sourced",
    sets: [
      {
        slug: "high-frequency",
        title: "High frequency",
        file: "unit/external/high_frequency.csv",
        description: "The most common words in Mandarin, from Wiktionary's frequency list",
      },
      {
        slug: "du-chinese",
        title: "DuChinese",
        file: "unit/external/du_chinese.csv",
        description: "From stories on DuChinese",
      },
      {
        slug: "china-institute",
        title: "China Institute",
        file: "unit/external/china_institute.csv",
        description: "From a class at the China Institute in NYC",
      },
      {
        slug: "duolingo",
        title: "Duolingo",
        file: "unit/external/duolingo.csv",
        description: "From Duolingo's public API",
      },
      {
        slug: "reddit-1",
        title: "Reddit 1",
        file: "unit/external/reddit-1.csv",
        description: "From a Reddit user's list",
      },
      {
        slug: "reddit-2",
        title: "Reddit 2",
        file: "unit/external/reddit-2.csv",
        description: "From a Reddit user's list",
      },
    ],
  },
];

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Every set, grouped for the set picker. */
export async function getFlashcardCatalog(): Promise<FlashcardCatalog> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  const counts = JSON.parse(await readDataFile("flashcard-sets.json")) as Record<string, number>;
  const classTopics = Object.entries(counts).map(([name, count]) => ({
    title: capitalize(name),
    sets: Array.from({ length: count }, (_, i) => ({
      slug: `${name}-${i + 1}`,
      title: `${capitalize(name)} ${i + 1}`,
      file: `class/${name}/${name}-${i + 1}.csv`,
    })),
  }));
  return { classTopics, collections: COLLECTIONS };
}

export async function getFlashcardSetInfo(slug: string): Promise<FlashcardSetInfo | undefined> {
  const { classTopics, collections } = await getFlashcardCatalog();
  return [...classTopics, ...collections]
    .flatMap((group) => group.sets)
    .find((set) => set.slug === slug);
}

type Row = { phrase?: string; english?: string; pinyin?: string; color?: string };

/** A set's cards, tokenized on the server. Rows without a phrase are skipped. */
export async function getFlashcardSet(slug: string): Promise<FlashcardSet | undefined> {
  "use cache";
  cacheLife("data");
  cacheTag(DATA_TAG);
  const info = await getFlashcardSetInfo(slug);
  if (!info) return undefined;

  const [csv, dictionary] = await Promise.all([
    readDataFile(`flashcards/${info.file}`),
    getDictionary(),
  ]);
  const { data } = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  const cards = data.flatMap((row, i): Flashcard[] => {
    const text = row.phrase?.trim();
    if (!text) return [];
    const color = row.color?.trim();
    return [
      {
        id: String(i),
        text,
        phrase: tokenize(text, dictionary, {
          pinyin: row.pinyin?.trim() || undefined,
          english: row.english?.trim() || undefined,
        }),
        color: isCardColor(color) ? color : undefined,
      },
    ];
  });
  return { ...info, cards };
}
