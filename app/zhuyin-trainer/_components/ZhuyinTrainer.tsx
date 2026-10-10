"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, Card, ProgressBar, SegmentedControl } from "@/design-system/controls";
import {
  AnnotationScope,
  Character,
  type AnnotationConfig,
  type Syllable,
} from "@/design-system/hanzi";
import { ArrowLeftIcon, ArrowRightIcon, MinusIcon, PlusIcon } from "@/design-system/icons";
import { useLocalStore } from "@/hooks";
import {
  PROGRESS_STEP,
  adjustZhuyinProgress,
  pickNext,
  syllableProgress,
  zhuyinProgressStore,
  zhuyinSymbols,
  type ProgressMap,
} from "@/lib/progress";
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

/** A syllable's next-pick weight input: how well its symbols are known. */
const progressOf = (syllable: Syllable, progress: ProgressMap) =>
  syllableProgress(syllable.zhuyin ?? "", progress);

/**
 * One syllable at a time, picked at random from every zhuyin syllable and
 * tone, weighted toward syllables whose symbols you know less well.
 *
 *   hidden:    [<] [ Reveal ] [>]
 *   revealed:  [<] [-] [ Next ] [+] [>]
 *
 * - and + move every zhuyin symbol in the syllable (ㄌㄧㄠ: ㄌ, ㄧ, and ㄠ),
 * then move on; the chart shows each symbol's progress. Keys: Space/Enter
 * reveals, then moves on; arrows walk the syllables already seen; once
 * revealed, - and + adjust.
 */
function Drill({ drill, mode }: { drill: Syllable[]; mode: Mode }) {
  const progress = useLocalStore(zhuyinProgressStore);
  const [history, setHistory] = useState(() => [
    pickNext(drill.map((syllable) => progressOf(syllable, zhuyinProgressStore.get()))),
  ]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shownMode, setShownMode] = useState(mode);
  if (mode !== shownMode) {
    setShownMode(mode);
    setRevealed(false);
  }

  const index = history[position];
  const syllable = drill[index];

  const reveal = () => setRevealed(true);
  const back = () => {
    if (position === 0) return;
    setPosition(position - 1);
    setRevealed(false);
  };
  /** The next syllable seen, or a new one. `updated` is progress just set. */
  const forward = (updated: ProgressMap = progress) => {
    if (position === history.length - 1) {
      const weights = drill.map((s) => progressOf(s, updated));
      setHistory([...history, pickNext(weights, index)]);
    }
    setPosition(position + 1);
    setRevealed(false);
  };
  const rate = (delta: number) => {
    adjustZhuyinProgress(syllable.zhuyin ?? "", delta);
    forward(zhuyinProgressStore.get());
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
      else if (revealed && event.key === "-") rate(-PROGRESS_STEP);
      else if (revealed && (event.key === "+" || event.key === "=")) rate(PROGRESS_STEP);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!syllable) return <p>No syllables to practice.</p>;

  const symbols = [...new Set(drill.flatMap((s) => zhuyinSymbols(s.zhuyin ?? "")))];
  const known = symbols.filter((symbol) => (progress[symbol] ?? 0) >= 1).length;
  const average =
    symbols.reduce((sum, symbol) => sum + (progress[symbol] ?? 0), 0) / symbols.length;

  return (
    <>
      <div className={styles.status}>
        <span className={styles.count}>
          {known} / {symbols.length} symbols known
        </span>
        <ProgressBar value={average} label="Zhuyin progress" />
      </div>
      <Card className={styles.card} onClick={revealed ? () => forward() : reveal}>
        <AnnotationScope {...MODES[mode].layers} english="collapsed" revealed={revealed}>
          <Character syllable={syllable} />
        </AnnotationScope>
      </Card>
      {/* One five-column grid for both states; the primary button keeps its key. */}
      <div className={styles.actions} data-revealed={revealed || undefined}>
        <Button key="back" iconOnly aria-label="Previous" disabled={position === 0} onClick={back}>
          <ArrowLeftIcon />
        </Button>
        {revealed && (
          <Button
            key="less"
            iconOnly
            aria-label="Less known, next syllable"
            onClick={() => rate(-PROGRESS_STEP)}
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
          <Button
            key="more"
            iconOnly
            aria-label="Better known, next syllable"
            onClick={() => rate(PROGRESS_STEP)}
          >
            <PlusIcon />
          </Button>
        )}
        <Button key="forward" iconOnly aria-label="Next" onClick={() => forward()}>
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
