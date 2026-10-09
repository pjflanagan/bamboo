"use client";

import { memo, useState, type CSSProperties } from "react";
import { SetChooser, findSet } from "@/components/flashcards";
import {
  Button,
  Card,
  Checkbox,
  ProgressBar,
  SegmentedControl,
  Slider,
  Table,
} from "@/design-system/controls";
import { AnnotationScope, Phrase } from "@/design-system/hanzi";
import { MinusIcon, PlusIcon } from "@/design-system/icons";
import { Modal } from "@/design-system/overlays";
import { useChosenSet, useFlashcardSet, useProgress } from "@/hooks";
import type { Flashcard, FlashcardCatalog } from "@/lib/data";
import { PROGRESS_STEP, type ProgressMap } from "@/lib/progress";
import styles from "./SetEditor.module.css";

type Order = "set" | "least" | "most";

const ORDER_OPTIONS = [
  { value: "set", label: "Set order" },
  { value: "least", label: "Least known" },
  { value: "most", label: "Most known" },
] as const;

/**
 * The rows to show, ordered and filtered by `snapshot`: progress as it was
 * when the options last changed, so rows don't jump or vanish mid-edit.
 */
function arrange(cards: Flashcard[], snapshot: ProgressMap, order: Order, hideKnown: boolean) {
  const valueOf = (card: Flashcard) => snapshot[card.text] ?? 0;
  const shown = hideKnown ? cards.filter((card) => valueOf(card) < 1) : cards;
  if (order === "set") return shown;
  const direction = order === "least" ? 1 : -1;
  // Array.prototype.sort is stable: equal progress keeps set order.
  return [...shown].sort((a, b) => direction * (valueOf(a) - valueOf(b)));
}

type RowProps = {
  card: Flashcard;
  value: number;
  setProgress: (key: string, value: number) => void;
};

/**
 * One card: the phrase with its reading and English, then its progress.
 * Memoized on the card's own value, so dragging one slider re-renders one
 * row, not the whole set.
 */
const Row = memo(function Row({ card, value, setProgress }: RowProps) {
  const percent = Math.round(value * 100);
  return (
    <tr data-known={value >= 1 || undefined}>
      <td
        className={styles.cardCell}
        style={
          card.color ? ({ "--row-color": `var(--card-${card.color})` } as CSSProperties) : undefined
        }
      >
        <Phrase phrase={card.phrase} />
      </td>
      <td className={styles.progressCell}>
        <div className={styles.progress}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={`Less known: ${card.text}`}
            disabled={value <= 0}
            onClick={() => setProgress(card.text, value - PROGRESS_STEP)}
          >
            <MinusIcon size={16} />
          </Button>
          <Slider
            label={`How well you know ${card.text}`}
            value={value}
            valueText={`${percent}% known`}
            onChange={(v) => setProgress(card.text, v)}
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={`Better known: ${card.text}`}
            disabled={value >= 1}
            onClick={() => setProgress(card.text, value + PROGRESS_STEP)}
          >
            <PlusIcon size={16} />
          </Button>
          <span className={styles.percent} aria-hidden>
            {percent}%
          </span>
        </div>
      </td>
    </tr>
  );
});

/**
 * Every card in the chosen set as a table, with its progress editable: the
 * same 0-1 value the flashcards page uses to pick lesser-known cards.
 */
export function SetEditor({ catalog }: { catalog: FlashcardCatalog }) {
  const [saved, choose] = useChosenSet();
  const slug = saved === undefined ? undefined : (findSet(catalog, saved)?.slug ?? null);
  const state = useFlashcardSet(slug);
  const { progress, setProgress, setManyProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  // Unchecked layers hide but keep their space; hovering (or tapping) a card peeks.
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [order, setOrder] = useState<Order>("set");
  const [hideKnown, setHideKnown] = useState(false);

  // Progress as of the last change to the set, order, or filter.
  const arrangement = `${state.status === "ready" ? state.set.slug : ""}|${order}|${hideKnown}`;
  const [snapshot, setSnapshot] = useState({ key: "", progress });
  if (snapshot.key !== arrangement) setSnapshot({ key: arrangement, progress });

  const cards = state.status === "ready" ? state.set.cards : [];
  const valueOf = (card: Flashcard) => progress[card.text] ?? 0;
  const known = cards.filter((card) => valueOf(card) >= 1).length;
  const average = cards.length ? cards.reduce((sum, c) => sum + valueOf(c), 0) / cards.length : 0;

  const rows = arrange(cards, snapshot.progress, order, hideKnown);

  const reset = () => {
    setManyProgress(Object.fromEntries(cards.map((card) => [card.text, 0])));
    setConfirmReset(false);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.bar}>
        <SetChooser catalog={catalog} slug={slug} onSelect={choose} />
        {state.status === "ready" && (
          <>
            <span className={styles.count}>
              {known} / {cards.length} known
            </span>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              Reset
            </Button>
          </>
        )}
      </div>

      {state.status === "ready" ? (
        <>
          <ProgressBar value={average} label="Set progress" />
          <div className={styles.options}>
            <div className={styles.toggles}>
              <Checkbox checked={showPinyin} onChange={setShowPinyin}>
                Pinyin
              </Checkbox>
              <Checkbox checked={showEnglish} onChange={setShowEnglish}>
                English
              </Checkbox>
              <Checkbox checked={hideKnown} onChange={setHideKnown}>
                Hide known
              </Checkbox>
            </div>
            <SegmentedControl
              label="Order"
              hideLabel
              size="sm"
              options={ORDER_OPTIONS}
              value={order}
              onChange={setOrder}
            />
          </div>
          <AnnotationScope
            hanzi="shown"
            pinyin={showPinyin ? "shown" : "hover"}
            zhuyin="collapsed"
            english={showEnglish ? "shown" : "hover"}
            revealUnit="phrase"
            size={26}
          >
            <Table className={styles.table}>
              <thead>
                <tr>
                  <th>Card</th>
                  <th className={styles.progressHead}>Known</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={2} className={styles.empty}>
                      Every card in this set is known.
                    </td>
                  </tr>
                )}
                {rows.map((card) => (
                  <Row key={card.id} card={card} value={valueOf(card)} setProgress={setProgress} />
                ))}
              </tbody>
            </Table>
          </AnnotationScope>
        </>
      ) : (
        <Card className={styles.placeholder} aria-busy={state.status === "loading"}>
          <p>
            {slug === null
              ? "Pick a set to see its cards."
              : state.status === "error"
                ? "Couldn't load this set. Pick another above."
                : "Loading…"}
          </p>
        </Card>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Reset this set?"
        description={`Every card in ${findSet(catalog, slug)?.title ?? "this set"} goes back to 0%. Cards shared with other sets reset there too.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={reset}>
              Reset
            </Button>
          </>
        }
      />
    </div>
  );
}
