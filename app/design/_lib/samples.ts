import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import type { PhraseData } from "@/design-system/hanzi";
import { parseDictionary, tokenize } from "@/lib/hanzi";

/** Real lines from data/, chosen to cover the layout's edge cases. */
const SAMPLES = [
  {
    // song lyric: multi-character words, neutral tone (的)
    text: "池塘邊的榕樹上",
    pinyin: "Chítáng biān de róngshù shàng",
    english: "In the banyan tree by the pond",
  },
  {
    // polyphone from context: 了 is liǎo here, not le
    text: "知了在聲聲叫著夏天",
    pinyin: "zhīliǎo zài shēngshēng jiàozhe xiàtiān",
    english: "Cicadas are calling summer loudly",
  },
  {
    // punctuation, a question particle, latin
    text: "這裡有wi-fi嗎？",
    pinyin: "zhè lǐ yǒu Wi-Fi ma?",
    english: "Is there wi-fi here?",
  },
  {
    // three-symbol zhuyin with tone marks, erhua
    text: "窗戶在哪兒",
    pinyin: "chuānghu zài nǎr",
    english: "Where is the window?",
  },
];

/**
 * Tokenized sample phrases for the playground. Reads the dictionary from
 * disk once at build time; the real data layer replaces this in step 6.
 */
export async function getSamplePhrases(): Promise<PhraseData[]> {
  "use cache";
  cacheLife("max");
  const csv = await readFile(join(process.cwd(), "data/dictionary.csv"), "utf-8");
  const dictionary = parseDictionary(csv);
  return SAMPLES.map(({ text, pinyin, english }) =>
    tokenize(text, dictionary, { pinyin, english }),
  );
}
