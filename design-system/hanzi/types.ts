/*
 * Data model for annotated Chinese text.
 *
 * Annotations live at different levels: pinyin and zhuyin belong to a single
 * character, but English belongs to a word or phrase (知了 is "cicada"; 知 and
 * 了 alone are not). Components only render this shape; building it (lookup,
 * segmentation) is lib/hanzi's job.
 */

/** 1-4 are the four tones, 5 is the neutral tone. */
export type Tone = 1 | 2 | 3 | 4 | 5;

export type Syllable = {
  trad: string;
  simp: string;
  /** Tone-marked pinyin for this character in context, e.g. "liǎo". */
  pinyin?: string;
  /** Zhuyin symbols without the tone mark, e.g. "ㄌㄧㄠ". */
  zhuyin?: string;
  tone?: Tone;
};

export type Token =
  | { kind: "hanzi"; syllable: Syllable }
  /** Punctuation, latin, digits: anything that isn't annotated. */
  | { kind: "text"; text: string };

export type WordData = {
  tokens: Token[];
  english?: string;
};

export type PhraseData = {
  words: WordData[];
  english?: string;
};

/** The annotation layers a scope can show, hide, or reveal. */
export const LAYERS = ["hanzi", "pinyin", "zhuyin", "english"] as const;
export type Layer = (typeof LAYERS)[number];

/**
 * A text cursor drawn over a phrase (the Read page's), by token index across
 * all its words.
 */
export type PhraseCursor = {
  /** The caret sits before this token; the token count puts it after the last. */
  caret?: number;
  /** Tokens in [start, end) are highlighted. */
  selected?: [number, number];
};
