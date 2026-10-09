import type { PhraseData, Syllable, Token, WordData } from "@/design-system/hanzi/types";
import type { Dictionary } from "./dictionary";
import { splitPinyin, type PinyinSyllable } from "./pinyin";

const HAN = /\p{Script=Han}/u;
/** Runs of characters that read as one text token: latin words, numbers. */
const WORDLIKE = /[\p{L}\p{N}]/u;
/** Joins two word-like runs into one token: "wi-fi", "don't", "3.5". */
const JOINER = /[-'’.]/;
/** Punctuation that opens: it sticks to the word after it, never the one before. */
const OPENING = /^[「『（《〈【〔“‘([{]+$/;

export type TokenizeOptions = {
  /**
   * Pinyin for the whole phrase, as written in a flashcard CSV
   * ("Chítáng biān de róngshù shàng"). When it lines up with the hanzi it is
   * used for each character's reading (so polyphones like 了 get the reading
   * from context) and its spaces become word boundaries.
   */
  pinyin?: string;
  english?: string;
};

function syllableFor(char: string, dictionary: Dictionary, reading?: PinyinSyllable): Syllable {
  const entry = dictionary.get(char);
  // Always display traditional, matching study-mandarin's behavior.
  const trad = entry?.trad ?? char;
  const simp = entry?.simp ?? char;
  if (reading) {
    return { trad, simp, pinyin: reading.pinyin, zhuyin: reading.zhuyin, tone: reading.tone };
  }
  if (entry) {
    return { trad, simp, pinyin: entry.pinyin, zhuyin: entry.zhuyin, tone: entry.tone };
  }
  return { trad, simp };
}

/** Splits text into hanzi characters and runs of everything else. */
function splitChars(text: string): { char: string; isHan: boolean }[] {
  const chars = [...text];
  const pieces: { char: string; isHan: boolean }[] = [];
  chars.forEach((char, i) => {
    const isHan = HAN.test(char);
    const last = pieces[pieces.length - 1];
    const inRun = last && !last.isHan && WORDLIKE.test(last.char);
    const continues =
      WORDLIKE.test(char) || (JOINER.test(char) && WORDLIKE.test(chars[i + 1] ?? ""));
    if (!isHan && inRun && continues) {
      last.char += char;
    } else {
      pieces.push({ char, isHan });
    }
  });
  return pieces.filter((p) => p.isHan || p.char.trim() !== "");
}

function isPunctuation(word: WordData): boolean {
  return word.tokens.every((t) => t.kind === "text" && !WORDLIKE.test(t.text));
}

/**
 * Attaches punctuation to its neighbor so a line never starts with "，" or
 * ends with "「": closing marks join the word before, opening marks the word
 * after.
 */
function attachPunctuation(words: WordData[]): WordData[] {
  const result: WordData[] = [];
  let opening: Token[] = [];
  for (const word of words) {
    if (!isPunctuation(word)) {
      result.push({ ...word, tokens: [...opening, ...word.tokens] });
      opening = [];
    } else if (word.tokens.every((t) => t.kind === "text" && OPENING.test(t.text))) {
      opening.push(...word.tokens);
    } else if (result.length > 0) {
      result[result.length - 1].tokens.push(...opening, ...word.tokens);
      opening = [];
    } else {
      opening.push(...word.tokens);
    }
  }
  if (opening.length > 0) result.push({ tokens: opening });
  return result;
}

/**
 * Builds PhraseData from raw text.
 *
 * With pinyin that matches the hanzi one-to-one, words follow the pinyin's
 * spaces and readings come from the pinyin. Otherwise every character is its
 * own word and readings come from the dictionary.
 */
export function tokenize(
  text: string,
  dictionary: Dictionary,
  { pinyin, english }: TokenizeOptions = {},
): PhraseData {
  const pieces = splitChars(text);
  const hanziCount = pieces.filter((p) => p.isHan).length;
  const pinyinWords = pinyin ? splitPinyin(pinyin) : null;
  const aligned =
    pinyinWords !== null && hanziCount > 0 && pinyinWords.flat().length === hanziCount;

  const words: WordData[] = [];
  let current: Token[] = [];
  const flush = () => {
    if (current.length > 0) words.push({ tokens: current });
    current = [];
  };

  if (aligned) {
    let wordIndex = 0;
    let syllableIndex = 0;
    for (const piece of pieces) {
      if (!piece.isHan) {
        flush();
        words.push({ tokens: [{ kind: "text", text: piece.char }] });
        continue;
      }
      const reading = pinyinWords[wordIndex][syllableIndex];
      current.push({ kind: "hanzi", syllable: syllableFor(piece.char, dictionary, reading) });
      syllableIndex++;
      if (syllableIndex === pinyinWords[wordIndex].length) {
        flush();
        wordIndex++;
        syllableIndex = 0;
      }
    }
    flush();
  } else {
    for (const piece of pieces) {
      const token: Token = piece.isHan
        ? { kind: "hanzi", syllable: syllableFor(piece.char, dictionary) }
        : { kind: "text", text: piece.char };
      words.push({ tokens: [token] });
    }
  }

  return { words: attachPunctuation(words), english };
}
