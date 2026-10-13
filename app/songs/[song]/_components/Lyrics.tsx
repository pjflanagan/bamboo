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
 * The scope keeps pinyin and English hidden, and Lyrics.module.css reveals
 * them with plain selectors on the attributes set here. Safari doesn't
 * repaint the lines when only the scope's custom properties change (a
 * checkbox, a hover), so those reveals don't go through the scope.
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
      <AnnotationScope
        hanzi="shown"
        pinyin="hidden"
        zhuyin={showZhuyin ? "shown" : "collapsed"}
        english="hidden"
        size={30}
      >
        <div
          ref={lyrics}
          className={styles.lyrics}
          data-pinyin={showPinyin || undefined}
          data-english={showEnglish || undefined}
        >
          {lines.map((line) =>
            line.kind === "section" ? (
              <h2 key={line.id} className={styles.section}>
                {line.title}
              </h2>
            ) : (
              <div
                key={line.id}
                className={styles.line}
                tabIndex={0}
                data-line={line.id}
                data-open={english.has(line.id) || undefined}
                data-pinyin={pinyin.has(line.id) || undefined}
                onClick={() => setEnglish((lines) => toggled(lines, line.id))}
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
