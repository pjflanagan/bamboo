import type { Tone } from "@/design-system/hanzi/types";
import { PINYIN_TO_ZHUYIN } from "./zhuyin-map";

/** Combining tone marks (after NFD normalization) -> tone number. */
const TONE_MARKS: Record<string, Tone> = {
  "\u0304": 1, // macron  ā
  "\u0301": 2, // acute   á
  "\u030C": 3, // caron   ǎ
  "\u0300": 4, // grave   à
  "\u0306": 3, // breve   ă: a common typo for the caron
};
const DIAERESIS = "\u0308"; // ü
const COMBINING = /[\u0300-\u036f]/;

/** One letter of a pinyin string: its toneless base and its original text. */
type Letter = { base: string; text: string; tone?: Tone };

/**
 * Splits a pinyin word into letters, separating tone from base. Handles
 * tone marks (mǎ), ü/v (lǜ, lv4), and tone numbers (ma3).
 */
function toLetters(word: string): Letter[] {
  const letters: Letter[] = [];
  for (const char of word.normalize("NFD").toLowerCase()) {
    const last = letters[letters.length - 1];
    if (COMBINING.test(char)) {
      if (!last) continue;
      last.text += char;
      if (char === DIAERESIS && last.base === "u") last.base = "ü";
      else if (TONE_MARKS[char]) last.tone = TONE_MARKS[char];
    } else if (/[1-5]/.test(char)) {
      if (last) last.tone = Number(char) as Tone;
    } else if (char === "v") {
      letters.push({ base: "ü", text: "ü" });
    } else {
      letters.push({ base: char, text: char });
    }
  }
  return letters;
}

/**
 * Segments letters into valid pinyin syllables: longest match first, with
 * backtracking. Returns null if no segmentation exists.
 */
function segment(letters: Letter[], start = 0): Letter[][] | null {
  if (start === letters.length) return [];
  const maxLength = Math.min(6, letters.length - start);
  for (let length = maxLength; length > 0; length--) {
    const candidate = letters.slice(start, start + length);
    const toneless = candidate.map((l) => l.base).join("");
    if (!(toneless in PINYIN_TO_ZHUYIN)) continue;
    const rest = segment(letters, start + length);
    if (rest) return [candidate, ...rest];
  }
  return null;
}

export type PinyinSyllable = {
  /** Tone-marked display form, e.g. "liǎo". */
  pinyin: string;
  toneless: string;
  tone: Tone;
  zhuyin: string;
};

function toSyllable(letters: Letter[]): PinyinSyllable {
  const toneless = letters.map((l) => l.base).join("");
  const tone = letters.find((l) => l.tone)?.tone ?? 5;
  const pinyin = letters
    .map((l) => l.text)
    .join("")
    .normalize("NFC");
  return { pinyin, toneless, tone, zhuyin: PINYIN_TO_ZHUYIN[toneless] };
}

/**
 * Splits one space-free pinyin word ("chítáng", "xī'ān", "nǎr") into
 * syllables. Returns null when the word isn't valid pinyin.
 */
export function splitPinyinWord(word: string): PinyinSyllable[] | null {
  const syllables: PinyinSyllable[] = [];
  // Apostrophes mark explicit syllable boundaries.
  for (const part of word.split(/['’]/)) {
    const letters = toLetters(part.replace(/[^\p{L}\p{M}1-5]/gu, ""));
    if (letters.length === 0) continue;
    const segments = segment(letters);
    if (!segments) return null;
    syllables.push(...segments.map(toSyllable));
  }
  return syllables;
}

/**
 * Splits a pinyin sentence into words of syllables. Words are separated by
 * whitespace; punctuation is dropped, and so are words that aren't pinyin
 * (latin like "Wi-Fi" or "3D" that appears as-is in the hanzi too). Callers
 * check that the syllable count matches the hanzi before trusting the result.
 */
export function splitPinyin(text: string): PinyinSyllable[][] {
  const words: PinyinSyllable[][] = [];
  for (const raw of text.trim().split(/\s+/)) {
    const syllables = splitPinyinWord(raw);
    if (syllables && syllables.length > 0) words.push(syllables);
  }
  return words;
}

/** Tone of a single tone-marked or numbered syllable. */
export function toneOf(syllable: string): Tone {
  return toLetters(syllable).find((l) => l.tone)?.tone ?? 5;
}

/** Zhuyin for a single toneless syllable, if it's valid pinyin. */
export function zhuyinOf(toneless: string): string | undefined {
  return PINYIN_TO_ZHUYIN[toneless.toLowerCase().replace(/v/g, "ü")];
}
