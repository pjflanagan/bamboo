"use client";

import {
  memo,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Card, Checkbox, SegmentedControl, buttonClassName } from "@/design-system/controls";
import { AnnotationScope, Phrase, type PhraseCursor, type PhraseData } from "@/design-system/hanzi";
import { ExternalLinkIcon } from "@/design-system/icons";
import { useDictionary, useLocalStore } from "@/hooks";
import { tokenOffsets, tokenize, type Dictionary } from "@/lib/hanzi";
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

/** Lines away from the cursor still get data-token, so clicks can find them. */
const NO_CURSOR: PhraseCursor = {};

/** The hidden textarea's selection; `caret` is the end that moves. */
type Selection = { start: number; end: number; caret: number };

type Line = {
  /** Offset of the line's first character in the whole text. */
  start: number;
  length: number;
  phrase: PhraseData | null;
  offsets: [number, number][];
};

function translateUrl(text: string) {
  return `https://translate.google.com/?sl=zh-TW&tl=en&op=translate&text=${encodeURIComponent(text)}`;
}

function readSelection(input: HTMLTextAreaElement): Selection {
  const { selectionStart: start, selectionEnd: end, selectionDirection } = input;
  return { start, end, caret: selectionDirection === "backward" ? start : end };
}

/** The line's caret and selection, by token index, or NO_CURSOR when neither is on it. */
function cursorFor(line: Line, { start, end, caret }: Selection): PhraseCursor {
  const from = start - line.start;
  const to = end - line.start;
  const at = caret - line.start;
  const cursor: PhraseCursor = {};

  if (at >= 0 && at <= line.length) {
    cursor.caret = line.offsets.filter(([s]) => s < at).length;
  }
  const selected = line.offsets.flatMap(([s, e], i) => (s < to && e > from ? [i] : []));
  if (selected.length > 0) cursor.selected = [selected[0], selected[selected.length - 1] + 1];

  return cursor.caret === undefined && !cursor.selected ? NO_CURSOR : cursor;
}

const ReaderLine = memo(function ReaderLine({
  index,
  phrase,
  cursor,
  placeholder,
}: {
  index: number;
  phrase: PhraseData | null;
  cursor: PhraseCursor;
  placeholder?: string;
}) {
  if (phrase) {
    return (
      <div data-line={index}>
        <Phrase phrase={phrase} cursor={cursor} />
      </div>
    );
  }
  // A blank line is a paragraph break, unless the caret is on it.
  if (cursor.caret === undefined) return <div data-line={index} className={styles.blank} />;
  return (
    <div data-line={index} className={styles.caretLine}>
      <span className={styles.caret} data-caret="" />
      {placeholder && <span className={styles.placeholder}>{placeholder}</span>}
    </div>
  );
});

/**
 * Type or paste Chinese and it's annotated as you write, in the reader's
 * script (traditional by default). The text lives in a hidden textarea, so
 * typing, IME composition, paste, arrow keys and undo are all native; the
 * card shows the annotated text with a caret and selection drawn where the
 * textarea's are. Clicking a character puts the caret on that side of it.
 *
 * The dictionary loads from /api/dictionary, and the text is kept on this
 * device between visits. /read?text=… opens with that text.
 */
export function Reader() {
  const text = useLocalStore(readerTextStore);
  const dictionary = useDictionary();
  const [showPinyin, setShowPinyin] = useState(true);
  const [showZhuyin, setShowZhuyin] = useState(true);
  const [size, setSize] = useState<Size>("md");
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0, caret: 0 });
  const input = useRef<HTMLTextAreaElement>(null);
  const output = useRef<HTMLDivElement>(null);

  const syncSelection = () => {
    if (input.current) setSelection(readSelection(input.current));
  };

  // A ?text= link replaces the saved text, once. On desktop, start typing at
  // the end right away, like the old reader; on touch that would pop up the keyboard.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("text");
    if (shared) readerTextStore.set(shared);
    const el = input.current;
    if (el && matchMedia("(pointer: fine)").matches) {
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
      setSelection(readSelection(el));
    }
  }, []);

  // Typing stays responsive in a long text: tokenizing can lag a keystroke
  // behind. Text and selection defer together so the caret always matches.
  const view = useMemo(() => ({ text, selection }), [text, selection]);
  const deferred = useDeferredValue(view);
  const words = dictionary.status === "ready" ? dictionary.dictionary : EMPTY;
  const lines = useMemo(() => {
    const result: Line[] = [];
    let start = 0;
    for (const line of deferred.text.split("\n")) {
      const phrase = line.trim() ? tokenize(line, words) : null;
      const offsets = phrase ? tokenOffsets(line, phrase) : [];
      result.push({ start, length: line.length, phrase, offsets });
      start += line.length + 1;
    }
    return result;
  }, [deferred.text, words]);
  const isEmpty = lines.every((line) => line.phrase === null);

  // Keep the hidden textarea at the caret: the IME's candidate window opens
  // there, and the browser scrolls it (and so the caret) into view as you type.
  useLayoutEffect(() => {
    const card = output.current;
    const caret = card?.querySelector("[data-caret]");
    if (!card || !caret || !input.current) return;
    const cardRect = card.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();
    input.current.style.top = `${caretRect.top - cardRect.top + card.scrollTop}px`;
    input.current.style.left = `${caretRect.left - cardRect.left + card.scrollLeft}px`;
    if (document.activeElement === input.current) caret.scrollIntoView({ block: "nearest" });
  }, [deferred, lines, size]);

  /** The text offset under a click: the nearer side of a character, or the end of a line. */
  const offsetAt = (event: MouseEvent) => {
    const target = event.target as Element;
    const lineEl = target.closest<HTMLElement>("[data-line]");
    const line = lineEl && lines[Number(lineEl.dataset.line)];
    if (!line) return text.length;
    const tokenEl = target.closest<HTMLElement>("[data-token]");
    const offsets = tokenEl && line.offsets[Number(tokenEl.dataset.token)];
    if (!tokenEl || !offsets) return line.start + line.length;
    const rect = tokenEl.getBoundingClientRect();
    const onLeft = event.clientX < rect.left + rect.width / 2;
    return line.start + (onLeft ? offsets[0] : offsets[1]);
  };

  const onClick = (event: MouseEvent) => {
    const el = input.current;
    if (!el || event.target === el) return;
    const offset = Math.min(offsetAt(event), el.value.length);
    if (event.shiftKey) {
      // Extend the selection from its fixed end, like a text field.
      const anchor = selection.caret === selection.start ? selection.end : selection.start;
      el.setSelectionRange(
        Math.min(anchor, offset),
        Math.max(anchor, offset),
        offset < anchor ? "backward" : "forward",
      );
    } else {
      el.setSelectionRange(offset, offset);
    }
    el.focus({ preventScroll: true });
    syncSelection();
  };

  return (
    <div className={styles.reader}>
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

      <Card
        ref={output}
        className={styles.output}
        aria-busy={dictionary.status === "loading"}
        // Keep focus in the textarea; clicks move its caret instead.
        onMouseDown={(event) => {
          if (event.target !== input.current) event.preventDefault();
        }}
        // Capture: a tap that reveals a character's reading still moves the caret.
        onClickCapture={onClick}
      >
        <textarea
          ref={input}
          className={styles.input}
          aria-label="Chinese text"
          lang="zh-Hant"
          wrap="off"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          value={text}
          onChange={(event) => {
            readerTextStore.set(event.target.value);
            syncSelection();
          }}
          onSelect={syncSelection}
        />
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
          {lines.map((line, i) => (
            <ReaderLine
              key={i}
              index={i}
              phrase={line.phrase}
              cursor={cursorFor(line, deferred.selection)}
              placeholder={isEmpty && i === 0 ? "Type or paste Chinese…" : undefined}
            />
          ))}
        </AnnotationScope>
      </Card>
    </div>
  );
}
