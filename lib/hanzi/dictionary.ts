import Papa from "papaparse";
import type { Tone } from "@/design-system/hanzi/types";

/** One row of data/dictionary.csv. */
export type DictionaryEntry = {
  trad: string;
  simp: string;
  pinyin: string;
  tone: Tone;
  zhuyin: string;
};

/** Character (traditional or simplified) -> entry. */
export type Dictionary = ReadonlyMap<string, DictionaryEntry>;

type Row = {
  hanzi: string;
  trad: string;
  simp: string;
  pinyin: string;
  tone: string;
  zhuyin: string;
};

/** Parses dictionary.csv text. Rows without a usable reading are skipped. */
export function parseDictionary(csv: string): Dictionary {
  const { data } = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  const dictionary = new Map<string, DictionaryEntry>();
  for (const row of data) {
    const tone = Number(row.tone);
    if (!row.hanzi || !row.zhuyin || !(tone >= 1 && tone <= 5)) continue;
    dictionary.set(row.hanzi, {
      trad: row.trad || row.hanzi,
      simp: row.simp || row.hanzi,
      pinyin: row.pinyin,
      tone: tone as Tone,
      zhuyin: row.zhuyin,
    });
  }
  return dictionary;
}

/**
 * The dictionary as JSON, for the browser (the reading tool tokenizes what
 * you type): character -> [trad, simp, pinyin, tone, zhuyin]. Tuples keep
 * it about half the size of objects.
 */
export type CompactDictionary = Record<string, [string, string, string, Tone, string]>;

export function compactDictionary(dictionary: Dictionary): CompactDictionary {
  const compact: CompactDictionary = {};
  for (const [char, { trad, simp, pinyin, tone, zhuyin }] of dictionary) {
    compact[char] = [trad, simp, pinyin, tone, zhuyin];
  }
  return compact;
}

export function expandDictionary(compact: CompactDictionary): Dictionary {
  return new Map(
    Object.entries(compact).map(([char, [trad, simp, pinyin, tone, zhuyin]]) => [
      char,
      { trad, simp, pinyin, tone, zhuyin },
    ]),
  );
}
