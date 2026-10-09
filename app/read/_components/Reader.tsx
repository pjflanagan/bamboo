"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Card,
  Checkbox,
  SegmentedControl,
  TextArea,
  buttonClassName,
} from "@/design-system/controls";
import { AnnotationScope, Phrase } from "@/design-system/hanzi";
import { ExternalLinkIcon } from "@/design-system/icons";
import { useDictionary, useLocalStore } from "@/hooks";
import { tokenize, type Dictionary } from "@/lib/hanzi";
import { readerTextStore } from "@/lib/storage";
import styles from "./Reader.module.css";

type Size = "sm" | "md" | "lg";

const SIZE_OPTIONS = [
  { value: "sm", label: "小" },
  { value: "md", label: "中" },
  { value: "lg", label: "大" },
] as const;

/** Until the dictionary loads, characters show without readings. */
const EMPTY: Dictionary = new Map();

function translateUrl(text: string) {
  return `https://translate.google.com/?sl=zh-TW&tl=en&op=translate&text=${encodeURIComponent(text)}`;
}

/**
 * Type or paste Chinese; each line comes back as annotated text, in the
 * reader's script (traditional by default). The dictionary loads from
 * /api/dictionary, and the text is kept on this device between visits.
 * /read?text=… opens with that text.
 */
export function Reader() {
  const text = useLocalStore(readerTextStore);
  const dictionary = useDictionary();
  const [showPinyin, setShowPinyin] = useState(true);
  const [showZhuyin, setShowZhuyin] = useState(true);
  const [size, setSize] = useState<Size>("md");

  // A ?text= link replaces the saved text, once.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("text");
    if (shared) readerTextStore.set(shared);
  }, []);

  // Typing stays responsive in a long text: tokenizing can lag a keystroke behind.
  const deferred = useDeferredValue(text);
  const words = dictionary.status === "ready" ? dictionary.dictionary : EMPTY;
  const lines = useMemo(
    () => deferred.split("\n").map((line) => (line.trim() ? tokenize(line, words) : null)),
    [deferred, words],
  );

  return (
    <div className={styles.reader}>
      <TextArea
        label="Chinese text"
        placeholder="Type or paste Chinese…"
        lang="zh-Hant"
        value={text}
        onChange={readerTextStore.set}
      />

      <div className={styles.options}>
        <div className={styles.toggles}>
          <Checkbox checked={showPinyin} onChange={setShowPinyin}>
            Pinyin
          </Checkbox>
          <Checkbox checked={showZhuyin} onChange={setShowZhuyin}>
            Zhuyin
          </Checkbox>
        </div>
        <div className={styles.end}>
          <SegmentedControl
            label="Size"
            hideLabel
            size="sm"
            options={SIZE_OPTIONS}
            value={size}
            onChange={setSize}
          />
          <a
            href={translateUrl(text)}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            Translate
            <ExternalLinkIcon size={14} />
          </a>
        </div>
      </div>

      <Card className={styles.output} aria-busy={dictionary.status === "loading"}>
        {dictionary.status === "error" && (
          <p className={styles.note}>Couldn&apos;t load the dictionary, so readings are missing.</p>
        )}
        {/* Unchecked layers keep their space; hovering (or tapping) a character peeks. */}
        <AnnotationScope
          hanzi="shown"
          pinyin={showPinyin ? "shown" : "hover"}
          zhuyin={showZhuyin ? "shown" : "hover"}
          english="collapsed"
          revealUnit="character"
          size={size}
        >
          {lines.every((line) => line === null) ? (
            <p className={styles.note}>Your text shows up here.</p>
          ) : (
            lines.map((phrase, i) =>
              phrase ? (
                <Phrase key={i} phrase={phrase} />
              ) : (
                <div key={i} className={styles.blank} />
              ),
            )
          )}
        </AnnotationScope>
      </Card>
    </div>
  );
}
