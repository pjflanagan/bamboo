"use client";

import type { CSSProperties } from "react";
import { sizeValue, type HanziSize } from "./annotation";
import { useUnitProps } from "./AnnotationScope";
import type { Syllable, Token, Tone } from "./types";
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

type CharacterProps = {
  syllable: Syllable;
  size?: HanziSize;
  /** Highlight, e.g. the cursor position on the Read page. */
  selected?: boolean;
};

/**
 * One hanzi with pinyin above and zhuyin to the right. Which of those show,
 * and how they're revealed, comes from the nearest AnnotationScope.
 */
export function Character({ syllable, size, selected }: CharacterProps) {
  const unitProps = useUnitProps("character");
  const { trad, simp, pinyin, zhuyin, tone } = syllable;

  return (
    <span
      className={styles.char}
      data-unit="character"
      data-tone={tone}
      data-selected={selected || undefined}
      lang="zh-Hant"
      style={sizeStyle(size)}
      {...unitProps}
    >
      <span className={styles.pinyin}>{pinyin}</span>
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
      <span className={styles.zhuyin}>
        <Zhuyin zhuyin={zhuyin} tone={tone} />
      </span>
    </span>
  );
}

/** Punctuation or latin inside a word: same box as a character, no annotations. */
function TextGlyph({ text }: { text: string }) {
  return (
    <span className={`${styles.char} ${styles.text}`}>
      <span className={styles.hanzi}>{text}</span>
    </span>
  );
}

export function TokenView({ token }: { token: Token }) {
  return token.kind === "hanzi" ? (
    <Character syllable={token.syllable} />
  ) : (
    <TextGlyph text={token.text} />
  );
}

export { sizeStyle };
