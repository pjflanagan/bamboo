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
};

/**
 * Words that wrap at word boundaries, never mid-word, with the phrase's
 * English line underneath.
 */
export function Phrase({ phrase, size }: PhraseProps) {
  const unitProps = useUnitProps("phrase");

  return (
    <div
      className={styles.phrase}
      data-unit="phrase"
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
