"use client";

import type { HanziSize } from "./annotation";
import { useUnitProps } from "./AnnotationScope";
import { TokenView, sizeStyle } from "./Character";
import type { PhraseCursor, WordData } from "./types";
import styles from "./hanzi.module.css";

type WordProps = {
  word: WordData;
  size?: HanziSize;
  /** Set by Phrase: where this word's tokens start in the phrase, and how many it has. */
  firstToken?: number;
  tokenCount?: number;
  cursor?: PhraseCursor;
};

/** A run of characters with an optional English gloss underneath. */
export function Word({ word, size, firstToken = 0, tokenCount, cursor }: WordProps) {
  const unitProps = useUnitProps("word");

  return (
    <span
      className={styles.word}
      data-unit="word"
      lang="zh-Hant"
      style={sizeStyle(size)}
      {...unitProps}
    >
      <span className={styles.chars}>
        {word.tokens.map((token, i) => (
          <TokenView
            key={i}
            token={token}
            index={firstToken + i}
            count={tokenCount ?? word.tokens.length}
            cursor={cursor}
          />
        ))}
      </span>
      {word.english && (
        <span className={styles.english} lang="en">
          {word.english}
        </span>
      )}
    </span>
  );
}
