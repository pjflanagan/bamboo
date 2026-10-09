"use client";

import { useEffect, useState } from "react";
import { Button, Card, ProgressBar, Slider, buttonClassName } from "@/design-system/controls";
import { AnnotationScope, Phrase, type AnnotationConfig } from "@/design-system/hanzi";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  MinusIcon,
  PlusIcon,
} from "@/design-system/icons";
import { useProgress } from "@/hooks";
import type { Flashcard } from "@/lib/data";
import { PROGRESS_STEP, pickNext } from "@/lib/progress";
import styles from "./FlashcardDeck.module.css";

/*
 * Each mode is just which layers start hidden. Revealing the card is the
 * scope's `revealed` instruction; hidden layers keep their space, so the
 * card doesn't change size when it flips.
 */
export type Mode = "hanzi" | "reading" | "english";

const MODES: Record<Mode, { label: string; layers: AnnotationConfig }> = {
  hanzi: {
    label: "漢字 → English",
    layers: { hanzi: "shown", pinyin: "hidden", zhuyin: "hidden", english: "hidden" },
  },
  reading: {
    label: "漢字 + 拼音 → English",
    layers: { hanzi: "shown", pinyin: "shown", zhuyin: "hidden", english: "hidden" },
  },
  english: {
    label: "English → 漢字",
    layers: { hanzi: "hidden", pinyin: "hidden", zhuyin: "hidden", english: "shown" },
  },
};

export const MODE_OPTIONS = (Object.keys(MODES) as Mode[]).map((value) => ({
  value,
  label: MODES[value].label,
}));

const HAN = /\p{Script=Han}/gu;

/** Bigger hanzi for shorter phrases. Sizes are in FlashcardDeck.module.css. */
function lengthOf(text: string): "short" | "medium" | "long" | "longer" {
  const count = text.match(HAN)?.length ?? 0;
  if (count <= 3) return "short";
  if (count <= 6) return "medium";
  if (count <= 12) return "long";
  return "longer";
}

function translateUrl(text: string) {
  return `https://translate.google.com/?sl=zh-TW&tl=en&op=translate&text=${encodeURIComponent(text)}`;
}

/**
 * One card at a time, chosen at random and weighted toward cards you know
 * less well (lib/progress). Each card's progress runs from 0 to 1:
 *
 *   hidden:    [<] [ Reveal ] [>]
 *   revealed:  [<] [-] [ Next ] [+] [Known] [>]
 *   always:    a slider showing the card's progress, settable anywhere
 *
 * -, +, and Known change the card's progress, then move on. The arrows walk
 * the cards already seen; going forward past the newest picks a new one.
 *
 * Keys: Space/Enter reveals, then moves on; arrows go back and forward;
 * once revealed, - and + adjust and K marks known (each then moves on).
 */
export function FlashcardDeck({ cards, mode }: { cards: Flashcard[]; mode: Mode }) {
  const { progress, setProgress } = useProgress();
  const progressOf = (card: Flashcard) => progress[card.text] ?? 0;

  // Cards seen so far (indices into `cards`), and which one is showing.
  const [history, setHistory] = useState(() => [pickNext(cards.map(progressOf))]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // A new mode starts the card over, hidden.
  const [shownMode, setShownMode] = useState(mode);
  if (mode !== shownMode) {
    setShownMode(mode);
    setRevealed(false);
  }

  const index = history[position];
  const card = cards[index];
  const value = card ? progressOf(card) : 0;

  const reveal = () => setRevealed(true);
  const back = () => {
    if (position === 0) return;
    setPosition(position - 1);
    setRevealed(false);
  };
  /** The next card seen, or a new one. `updated` is progress just set for this card. */
  const forward = (updated?: number) => {
    if (position < history.length - 1) {
      setPosition(position + 1);
    } else {
      const weights = cards.map((c, i) =>
        i === index && updated !== undefined ? updated : progressOf(c),
      );
      setHistory([...history, pickNext(weights, index)]);
      setPosition(position + 1);
    }
    setRevealed(false);
  };
  const rate = (next: number) => {
    setProgress(card.text, next);
    forward(next);
  };

  // Re-attached every render, so it always sees the current card and state.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Leave keys alone while a control (a button, the slider) has focus.
      if (event.target !== document.body || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault(); // Space would scroll
        if (revealed) forward();
        else reveal();
      } else if (event.key === "ArrowRight") forward();
      else if (event.key === "ArrowLeft") back();
      else if (revealed && event.key === "-") rate(value - PROGRESS_STEP);
      else if (revealed && (event.key === "+" || event.key === "=")) rate(value + PROGRESS_STEP);
      else if (revealed && event.key.toLowerCase() === "k") rate(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!card) return <p>This set has no cards yet.</p>;

  const known = cards.filter((c) => progressOf(c) >= 1).length;
  const average = cards.reduce((sum, c) => sum + progressOf(c), 0) / cards.length;
  const percent = Math.round(value * 100);

  return (
    <div className={styles.deck}>
      <div className={styles.status}>
        <span className={styles.count}>
          {known} / {cards.length} known
        </span>
        <ProgressBar value={average} label="Set progress" />
      </div>

      {/* Clicking the card is a shortcut for Reveal, then Next. */}
      <Card
        color={card.color}
        className={styles.card}
        data-length={lengthOf(card.text)}
        onClick={revealed ? () => forward() : reveal}
      >
        <AnnotationScope {...MODES[mode].layers} revealed={revealed}>
          <Phrase phrase={card.phrase} align="center" />
        </AnnotationScope>
      </Card>

      {/*
       * One six-column grid for both states, arrows always at the ends. The
       * primary button keeps its key, so focus stays on it from Reveal to Next.
       */}
      <div className={styles.actions} data-revealed={revealed || undefined}>
        <Button
          key="back"
          iconOnly
          aria-label="Previous card"
          disabled={position === 0}
          onClick={back}
        >
          <ArrowLeftIcon />
        </Button>
        {revealed && (
          <Button
            key="less"
            iconOnly
            aria-label="Less known, next card"
            onClick={() => rate(value - PROGRESS_STEP)}
          >
            <MinusIcon />
          </Button>
        )}
        <Button
          key="primary"
          variant="primary"
          className={styles.primary}
          onClick={revealed ? () => forward() : reveal}
        >
          {revealed ? "Next" : "Reveal"}
        </Button>
        {revealed && (
          <>
            <Button
              key="more"
              iconOnly
              aria-label="Better known, next card"
              onClick={() => rate(value + PROGRESS_STEP)}
            >
              <PlusIcon />
            </Button>
            <Button key="known" aria-label="Known, next card" onClick={() => rate(1)}>
              <CheckIcon size={16} />
              <span className={styles.knownLabel}>Known</span>
            </Button>
          </>
        )}
        <Button key="forward" iconOnly aria-label="Next card" onClick={() => forward()}>
          <ArrowRightIcon />
        </Button>
      </div>

      <div className={styles.progress}>
        <Slider
          label="How well you know this card"
          value={value}
          valueText={`${percent}% known`}
          onChange={(v) => setProgress(card.text, v)}
        />
        <span className={styles.percent} aria-hidden>
          {percent}%
        </span>
      </div>

      <a
        href={translateUrl(card.text)}
        target="_blank"
        rel="noreferrer"
        className={buttonClassName({ variant: "ghost", size: "sm", className: styles.translate })}
      >
        Google Translate
        <ExternalLinkIcon size={14} />
      </a>
    </div>
  );
}
