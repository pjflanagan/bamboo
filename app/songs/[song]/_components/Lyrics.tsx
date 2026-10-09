"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { Checkbox } from "@/design-system/controls";
import { AnnotationScope, Phrase } from "@/design-system/hanzi";
import type { SongLine } from "@/lib/data";
import styles from "./Lyrics.module.css";

/**
 * The lyrics, line by line, with section headings. Pinyin and English start
 * hidden, as karaoke should; hovering (or tapping) a line peeks at it, and
 * the checkboxes show a layer on every line. A colored line marks who sings
 * it in a duet.
 */
export function Lyrics({ lines }: { lines: SongLine[] }) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [showZhuyin, setShowZhuyin] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  return (
    <>
      <div className={styles.toggles}>
        <Checkbox checked={showPinyin} onChange={setShowPinyin}>
          Pinyin
        </Checkbox>
        <Checkbox checked={showZhuyin} onChange={setShowZhuyin}>
          Zhuyin
        </Checkbox>
        <Checkbox checked={showEnglish} onChange={setShowEnglish}>
          English
        </Checkbox>
      </div>
      <AnnotationScope
        hanzi="shown"
        pinyin={showPinyin ? "shown" : "hover"}
        zhuyin={showZhuyin ? "shown" : "collapsed"}
        english={showEnglish ? "shown" : "hover"}
        revealUnit="phrase"
        size={30}
      >
        <div className={styles.lyrics}>
          {lines.map((line) =>
            line.kind === "section" ? (
              <h2 key={line.id} className={styles.section}>
                {line.title}
              </h2>
            ) : (
              <div
                key={line.id}
                className={styles.line}
                style={
                  line.color
                    ? ({ "--line-color": `var(--swatch-${line.color})` } as CSSProperties)
                    : undefined
                }
              >
                <Phrase phrase={line.phrase} />
              </div>
            ),
          )}
        </div>
      </AnnotationScope>
    </>
  );
}
