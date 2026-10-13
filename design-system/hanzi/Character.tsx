"use client";

import type { CSSProperties } from "react";
import { sizeValue, type HanziSize } from "./annotation";
import { useUnitProps } from "./AnnotationScope";
import type { PhraseCursor, Syllable, Token, Tone } from "./types";
import styles from "./hanzi.module.css";

/** Tone 1 is unmarked; the neutral-tone dot goes above the symbols, not beside. */
const ZHUYIN_TONE_MARKS: Record<Tone, string> = { 1: "", 2: "ˊ", 3: "ˇ", 4: "ˋ", 5: "˙" };

function sizeStyle(size?: HanziSize): CSSProperties | undefined {
  return size === undefined ? undefined : ({ "--hanzi-size": sizeValue(size) } as CSSProperties);
}

function Zhuyin({ zhuyin, tone }: Pick<Syllable, "zhuyin" | "tone">) {
  if (!zhuyin) return null;
  const mark = tone ? ZHUYIN_TONE_MARKS[tone] : "";
  return (
    <>
      <span className={styles.zhuyinSymbols}>
        {/* The neutral-tone dot sits above the symbols, in the same column. */}
        {tone === 5 && mark}
        {zhuyin}
      </span>
      {tone !== 5 && mark && <span className={styles.toneMark}>{mark}</span>}
    </>
  );
}

/** How a token shows a PhraseCursor; `token` is its index, for hit-testing. */
type CursorMarks = {
  /** Highlight, e.g. the Read page's selection. */
  selected?: boolean;
  /** A blinking caret on this side of the glyph. */
  caret?: "before" | "after";
  token?: number;
};

function cursorProps({ selected, caret, token }: CursorMarks) {
  return { "data-selected": selected || undefined, "data-caret": caret, "data-token": token };
}

type CharacterProps = CursorMarks & {
  syllable: Syllable;
  size?: HanziSize;
};

/**
 * One hanzi with pinyin above and zhuyin to the right. Which of those show,
 * and how they're revealed, comes from the nearest AnnotationScope.
 */
export function Character({ syllable, size, ...marks }: CharacterProps) {
  const unitProps = useUnitProps("character");
  const { trad, simp, pinyin, zhuyin, tone } = syllable;

  return (
    <span
      className={styles.char}
      data-unit="character"
      data-tone={tone}
      {...cursorProps(marks)}
      lang="zh-Hant"
      style={sizeStyle(size)}
      {...unitProps}
    >
      <span className={styles.pinyin} data-layer="pinyin">
        {pinyin}
      </span>
      <span className={styles.hanzi}>
        {trad === simp ? (
          trad
        ) : (
          <>
            <span className={styles.trad}>{trad}</span>
            <span className={styles.simp} lang="zh-Hans">
              {simp}
            </span>
          </>
        )}
      </span>
      <span className={styles.zhuyin} data-layer="zhuyin">
        <Zhuyin zhuyin={zhuyin} tone={tone} />
      </span>
    </span>
  );
}

/** Punctuation or latin inside a word: same box as a character, no annotations. */
function TextGlyph({ text, ...marks }: CursorMarks & { text: string }) {
  return (
    <span className={`${styles.char} ${styles.text}`} {...cursorProps(marks)}>
      <span className={styles.hanzi}>{text}</span>
    </span>
  );
}

type TokenViewProps = {
  token: Token;
  /** The token's index in its phrase, and the phrase's token count. */
  index?: number;
  count?: number;
  cursor?: PhraseCursor;
};

export function TokenView({ token, index = 0, count = 0, cursor }: TokenViewProps) {
  const marks: CursorMarks = cursor
    ? {
        token: index,
        selected:
          cursor.selected !== undefined &&
          index >= cursor.selected[0] &&
          index < cursor.selected[1],
        caret:
          cursor.caret === index
            ? "before"
            : cursor.caret === count && index === count - 1
              ? "after"
              : undefined,
      }
    : {};
  return token.kind === "hanzi" ? (
    <Character syllable={token.syllable} {...marks} />
  ) : (
    <TextGlyph text={token.text} {...marks} />
  );
}

export { sizeStyle };
