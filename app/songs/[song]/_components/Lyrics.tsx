"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/design-system/controls";
import { AnnotationScope, Phrase } from "@/design-system/hanzi";
import type { SongLine } from "@/lib/data";
import styles from "./Lyrics.module.css";

/**
 * A song: a sticky bar with its title and the layer checkboxes, then whatever
 * the page puts above the lyrics (the player), which scrolls away, then the
 * lyrics, line by line, with section headings. Pinyin and English start
 * hidden, as karaoke should: hovering a line peeks at its pinyin, clicking it
 * keeps its English open (on a touch screen a tap shows both), and the
 * checkboxes show a layer on every line. Zhuyin only has its checkbox. A
 * colored line marks who sings it in a duet.
 *
 * The keyboard works on one line at a time: the up and down arrows move to
 * the previous or next line without revealing anything, then P toggles that
 * line's pinyin, E its English, and Space or Enter both at once.
 *
 * Which layers a line shows is decided here, in React, and the line's phrase
 * is remounted when that changes (see Line). Safari doesn't repaint text
 * whose visibility flips in place, by custom property or by plain selector:
 * the change only showed up once something else repainted the line.
 */
const USES_KEYS =
  'textarea, select, input:not([type="checkbox"]), [contenteditable], [role="menu"], [role="listbox"], dialog';

/** The set with `id` in it or not. */
function withLine(set: ReadonlySet<string>, id: string, present: boolean): ReadonlySet<string> {
  const next = new Set(set);
  if (present) next.add(id);
  else next.delete(id);
  return next;
}

/** The set with `id` added, or removed if it was there. */
function toggled(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  return withLine(set, id, !set.has(id));
}

type LyricsProps = {
  title: string;
  artist?: string;
  lines: SongLine[];
  /** Shown between the sticky bar and the lyrics. */
  children?: ReactNode;
};

export function Lyrics({ title, artist, lines, children }: LyricsProps) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [showZhuyin, setShowZhuyin] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  /** Lines whose English (a click, or E) and pinyin (P) are held open. */
  const [english, setEnglish] = useState<ReadonlySet<string>>(new Set());
  const [pinyin, setPinyin] = useState<ReadonlySet<string>>(new Set());
  const lyrics = useRef<HTMLDivElement>(null);

  // On the window, so the arrows work before any line has focus.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      // Leave the keys to anything that uses them itself.
      if ((event.target as Element).closest?.(USES_KEYS)) return;

      const all = Array.from(lyrics.current?.querySelectorAll<HTMLElement>("[data-line]") ?? []);
      const at = all.indexOf(document.activeElement as HTMLElement);
      const key = event.key.toLowerCase();

      if (key === "e" || key === "p") {
        if (at === -1) return;
        event.preventDefault();
        (key === "e" ? setEnglish : setPinyin)((lines) => toggled(lines, all[at].dataset.line!));
        return;
      }

      if (key === " " || key === "enter") {
        if (at === -1) return;
        event.preventDefault();
        // Shows both, unless both already are: then it hides them.
        const id = all[at].dataset.line!;
        const show = !(all[at].dataset.open && all[at].dataset.pinyin);
        setEnglish((lines) => withLine(lines, id, show));
        setPinyin((lines) => withLine(lines, id, show));
        return;
      }

      if (event.shiftKey || (key !== "arrowdown" && key !== "arrowup")) return;
      const next = at === -1 ? all[0] : all[at + (key === "arrowdown" ? 1 : -1)];
      event.preventDefault(); // the page shouldn't scroll as well
      if (!next) return;
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: "nearest" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={styles.bar}>
        <h1 className={styles.title}>
          {title}
          {artist && <span className={styles.artist}>{artist}</span>}
        </h1>
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
      </header>
      {children}
      <AnnotationScope hanzi="shown" zhuyin={showZhuyin ? "shown" : "collapsed"} size={30}>
        <div ref={lyrics} className={styles.lyrics}>
          {lines.map((line) =>
            line.kind === "section" ? (
              <h2 key={line.id} className={styles.section}>
                {line.title}
              </h2>
            ) : (
              <Line
                key={line.id}
                line={line}
                pinyin={pinyin.has(line.id)}
                english={english.has(line.id)}
                showPinyin={showPinyin}
                showEnglish={showEnglish}
                onClick={() => {
                  setEnglish((lines) => toggled(lines, line.id));
                  // No hover to peek at pinyin with: a tap brings it along.
                  if (matchMedia("(hover: none)").matches) {
                    setPinyin((lines) => withLine(lines, line.id, !english.has(line.id)));
                  }
                }}
              />
            ),
          )}
        </div>
      </AnnotationScope>
    </>
  );
}

type LineProps = {
  line: Extract<SongLine, { kind: "line" }>;
  /** Held open on this line: pinyin by P, English by a click or E. */
  pinyin: boolean;
  english: boolean;
  /** The checkboxes. */
  showPinyin: boolean;
  showEnglish: boolean;
  onClick(): void;
};

function Line({ line, pinyin, english, showPinyin, showEnglish, onClick }: LineProps) {
  const [hovered, setHovered] = useState(false);
  const pinyinMode = showPinyin || pinyin || hovered ? "shown" : "hidden";
  const englishMode = showEnglish || english ? "shown" : "hidden";

  return (
    <div
      className={styles.line}
      tabIndex={0}
      data-line={line.id}
      data-open={english || undefined}
      data-pinyin={pinyin || undefined}
      onClick={onClick}
      // Mouse only: a touch's pointerenter has no matching leave until the next tap.
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={
        line.color
          ? ({ "--line-color": `var(--swatch-${line.color})` } as CSSProperties)
          : undefined
      }
    >
      {/* Keyed on what it shows, so a change remounts the phrase: see Lyrics. */}
      <AnnotationScope
        key={`${pinyinMode}-${englishMode}`}
        pinyin={pinyinMode}
        english={englishMode}
      >
        <Phrase phrase={line.phrase} />
      </AnnotationScope>
    </div>
  );
}
