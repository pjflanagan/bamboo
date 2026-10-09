"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Card, SegmentedControl } from "@/design-system/controls";
import {
  AnnotationScope,
  Character,
  type AnnotationConfig,
  type Syllable,
} from "@/design-system/hanzi";
import { ArrowLeftIcon, ArrowRightIcon } from "@/design-system/icons";
import styles from "./ZhuyinTrainer.module.css";

type Mode = "zhuyin" | "pinyin";

/** Each mode is which layer you read; Reveal shows the rest. */
const MODES: Record<Mode, { label: string; layers: AnnotationConfig }> = {
  zhuyin: {
    label: "注音 → 拼音",
    layers: { hanzi: "hidden", pinyin: "hidden", zhuyin: "shown" },
  },
  pinyin: {
    label: "拼音 → 注音",
    layers: { hanzi: "hidden", pinyin: "shown", zhuyin: "hidden" },
  },
};

const MODE_OPTIONS = (Object.keys(MODES) as Mode[]).map((value) => ({
  value,
  label: MODES[value].label,
}));

/** Any syllable but the current one. */
function pickOther(count: number, current?: number): number {
  if (count < 2) return 0;
  const next = Math.floor(Math.random() * (count - 1));
  return current !== undefined && next >= current ? next + 1 : next;
}

const noSubscribe = () => () => {};

/**
 * The first syllable is random, which prerendering can't know: the static
 * page shows an empty card, and the drill starts once the page hydrates.
 */
export function ZhuyinTrainer({ drill }: { drill: Syllable[] }) {
  const [mode, setMode] = useState<Mode>("zhuyin");
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  return (
    <div className={styles.trainer}>
      <div className={styles.modes}>
        <SegmentedControl
          label="Mode"
          hideLabel
          size="sm"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      </div>
      {inBrowser ? <Drill drill={drill} mode={mode} /> : <Card className={styles.card} aria-busy />}
    </div>
  );
}

/**
 * One syllable at a time, picked at random from every zhuyin syllable and
 * tone. Space/Enter reveals, then moves on; the arrows walk the syllables
 * already seen.
 */
function Drill({ drill, mode }: { drill: Syllable[]; mode: Mode }) {
  const [history, setHistory] = useState(() => [pickOther(drill.length)]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shownMode, setShownMode] = useState(mode);
  if (mode !== shownMode) {
    setShownMode(mode);
    setRevealed(false);
  }

  const syllable = drill[history[position]];

  const reveal = () => setRevealed(true);
  const back = () => {
    if (position === 0) return;
    setPosition(position - 1);
    setRevealed(false);
  };
  const forward = () => {
    if (position === history.length - 1) {
      setHistory([...history, pickOther(drill.length, history[position])]);
    }
    setPosition(position + 1);
    setRevealed(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (revealed) forward();
        else reveal();
      } else if (event.key === "ArrowRight") forward();
      else if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!syllable) return <p>No syllables to practice.</p>;

  return (
    <>
      <Card className={styles.card} onClick={revealed ? forward : reveal}>
        <AnnotationScope {...MODES[mode].layers} english="collapsed" revealed={revealed}>
          <Character syllable={syllable} />
        </AnnotationScope>
      </Card>
      <div className={styles.actions}>
        <Button iconOnly aria-label="Previous" disabled={position === 0} onClick={back}>
          <ArrowLeftIcon />
        </Button>
        <Button variant="primary" className={styles.primary} onClick={revealed ? forward : reveal}>
          {revealed ? "Next" : "Reveal"}
        </Button>
        <Button iconOnly aria-label="Next" onClick={forward}>
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
