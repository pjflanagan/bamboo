"use client";

import type { HanziSize } from "./annotation";
import { useUnitProps } from "./AnnotationScope";
import { sizeStyle } from "./Character";
import type { PhraseCursor, PhraseData } from "./types";
import { Word } from "./Word";
import styles from "./hanzi.module.css";

type PhraseProps = {
  phrase: PhraseData;
  size?: HanziSize;
  /** Center the words and the English line, for cards and titles. */
  align?: "start" | "center";
  /** A caret and selection to draw; tokens also get data-token for hit-testing. */
  cursor?: PhraseCursor;
};

/**
 * Words that wrap at word boundaries, never mid-word, with the phrase's
 * English line underneath.
 */
export function Phrase({ phrase, size, align = "start", cursor }: PhraseProps) {
  const unitProps = useUnitProps("phrase");
  // Where each word's tokens start in the phrase, then the total.
  const starts = [0];
  for (const word of phrase.words) starts.push(starts[starts.length - 1] + word.tokens.length);

  return (
    <div
      className={styles.phrase}
      data-unit="phrase"
      data-align={align}
      lang="zh-Hant"
      style={sizeStyle(size)}
      {...unitProps}
    >
      <div className={styles.words}>
        {phrase.words.map((word, i) => (
          <Word
            key={i}
            word={word}
            firstToken={starts[i]}
            tokenCount={starts[phrase.words.length]}
            cursor={cursor}
          />
        ))}
      </div>
      {phrase.english && (
        <div className={styles.phraseEnglish} data-layer="english" lang="en">
          {phrase.english}
        </div>
      )}
    </div>
  );
}
