"use client";

import type { HanziSize } from "./annotation";
import { useUnitProps } from "./AnnotationScope";
import { sizeStyle } from "./Character";
import type { PhraseData } from "./types";
import { Word } from "./Word";
import styles from "./hanzi.module.css";

type PhraseProps = {
  phrase: PhraseData;
  size?: HanziSize;
  /** Center the words and the English line, for cards and titles. */
  align?: "start" | "center";
};

/**
 * Words that wrap at word boundaries, never mid-word, with the phrase's
 * English line underneath.
 */
export function Phrase({ phrase, size, align = "start" }: PhraseProps) {
  const unitProps = useUnitProps("phrase");

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
          <Word key={i} word={word} />
        ))}
      </div>
      {phrase.english && (
        <div className={styles.phraseEnglish} lang="en">
          {phrase.english}
        </div>
      )}
    </div>
  );
}
