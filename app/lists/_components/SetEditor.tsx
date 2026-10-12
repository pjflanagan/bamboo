"use client";

import { memo, useState, type CSSProperties, type ReactNode } from "react";
import { BackToTop } from "@/components/BackToTop";
import { SetChooser, findSet } from "@/components/flashcards";
import {
  Button,
  Card,
  Checkbox,
  ProgressBar,
  SearchField,
  Slider,
  Table,
} from "@/design-system/controls";
import { AnnotationScope, Phrase } from "@/design-system/hanzi";
import { CheckIcon, MinusIcon, PlusIcon, StarIcon } from "@/design-system/icons";
import { Modal } from "@/design-system/overlays";
import { useChosenSet, useFlashcardSet, useProgress, useStars } from "@/hooks";
import type { Flashcard, FlashcardCatalog } from "@/lib/data";
import { PROGRESS_STEP, type ProgressMap } from "@/lib/progress";
import { phraseMatches } from "@/lib/text";
import styles from "./SetEditor.module.css";

type Column = "star" | "progress";
type Direction = "ascending" | "descending";
/** Null is the set's own order. */
type Sort = { column: Column; direction: Direction } | null;

/** Each sortable column: the direction its first click gives, and what each direction means. */
const COLUMNS: Record<Column, { first: Direction } & Record<Direction, string>> = {
  star: { first: "descending", descending: "Starred first", ascending: "Starred last" },
  progress: { first: "ascending", ascending: "Least known first", descending: "Most known first" },
};

/** A header click: the column's first direction, then the other, then back to set order. */
function nextSort(sort: Sort, column: Column): Sort {
  const { first } = COLUMNS[column];
  if (sort?.column !== column) return { column, direction: first };
  if (sort.direction !== first) return null;
  return { column, direction: first === "ascending" ? "descending" : "ascending" };
}

type Snapshot = { progress: ProgressMap; starred: ReadonlySet<string> };

/**
 * The rows to show, ordered and filtered by `snapshot`: progress and stars
 * as they were when the options last changed, so rows don't jump or vanish
 * mid-edit.
 */
function arrange(cards: Flashcard[], snapshot: Snapshot, sort: Sort, hideKnown: boolean) {
  const valueOf = (card: Flashcard) => snapshot.progress[card.text] ?? 0;
  const shown = hideKnown ? cards.filter((card) => valueOf(card) < 1) : cards;
  if (!sort) return shown;
  const keyOf =
    sort.column === "star" ? (card: Flashcard) => Number(snapshot.starred.has(card.text)) : valueOf;
  const sign = sort.direction === "ascending" ? 1 : -1;
  // Array.prototype.sort is stable: equal cards keep set order.
  return [...shown].sort((a, b) => sign * (keyOf(a) - keyOf(b)));
}

type SortHeaderProps = {
  column: Column;
  sort: Sort;
  onSort: (sort: Sort) => void;
  /** Accessible name, for a header that's only an icon. */
  label?: string;
  className?: string;
  children: ReactNode;
  /** More of the column's controls, after the sort. */
  after?: ReactNode;
};

/** A column header that sorts by its column: click to cycle, the arrow shows which way. */
function SortHeader({ column, sort, onSort, label, className, children, after }: SortHeaderProps) {
  const direction = sort?.column === column ? sort.direction : undefined;
  return (
    <th className={className} aria-sort={direction ?? "none"}>
      <div className={styles.headControls}>
        <button
          type="button"
          className={styles.sort}
          aria-label={label}
          title={
            direction
              ? COLUMNS[column][direction]
              : `Sort: ${COLUMNS[column][COLUMNS[column].first].toLowerCase()}`
          }
          onClick={() => onSort(nextSort(sort, column))}
        >
          {children}
          <span className={styles.arrow} aria-hidden>
            {direction === "ascending" ? "↑" : direction === "descending" ? "↓" : "↕"}
          </span>
        </button>
        {after}
      </div>
    </th>
  );
}

type RowProps = {
  card: Flashcard;
  value: number;
  starred: boolean;
  setProgress: (key: string, value: number) => void;
  toggleStar: (key: string) => void;
};

/**
 * One card: its star, the phrase with its reading and English, then its
 * progress. Memoized on the card's own value and star, so dragging one
 * slider re-renders one row, not the whole set.
 */
const Row = memo(function Row({ card, value, starred, setProgress, toggleStar }: RowProps) {
  const percent = Math.round(value * 100);
  return (
    <tr data-known={value >= 1 || undefined}>
      <td
        className={styles.starCell}
        style={
          card.color ? ({ "--row-color": `var(--card-${card.color})` } as CSSProperties) : undefined
        }
      >
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className={styles.star}
          aria-pressed={starred}
          aria-label={`Star, to show more often: ${card.text}`}
          title={starred ? "Starred: shown more often" : "Star to show more often"}
          onClick={() => toggleStar(card.text)}
        >
          <StarIcon size={16} fill={starred ? "currentColor" : "none"} />
        </Button>
      </td>
      <td>
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
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={styles.known}
            aria-label={`Known: ${card.text}`}
            disabled={value >= 1}
            onClick={() => setProgress(card.text, 1)}
          >
            <CheckIcon size={16} />
          </Button>
        </div>
      </td>
    </tr>
  );
});

/**
 * Every card in the chosen set as a table, with its progress editable: the
 * same 0-1 value the flashcards page uses to pick lesser-known cards, and
 * the star that makes a card come up more often.
 *
 * Search finds cards; the table's header holds what's about its columns:
 * which layers the cards show, the order (by star or by progress), and
 * whether known cards are listed. The header stays in view under the page header while the rows
 * scroll, and a button goes back up to the search.
 */
export function SetEditor({ catalog }: { catalog: FlashcardCatalog }) {
  const [saved, choose] = useChosenSet();
  const slug = saved === undefined ? undefined : (findSet(catalog, saved)?.slug ?? null);
  const state = useFlashcardSet(slug);
  const { progress, setProgress, setManyProgress } = useProgress();
  const { starred, toggleStar } = useStars();
  const [confirmReset, setConfirmReset] = useState(false);
  // Unchecked layers hide but keep their space; hovering (or tapping) a card peeks.
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [sort, setSort] = useState<Sort>(null);
  const [hideKnown, setHideKnown] = useState(false);
  const [search, setSearch] = useState("");

  // Progress and stars as of the last change to the set, order, or filter.
  const arrangement = [
    state.status === "ready" ? state.set.slug : "",
    sort?.column,
    sort?.direction,
    hideKnown,
  ].join("|");
  const [snapshot, setSnapshot] = useState({ key: "", progress, starred });
  if (snapshot.key !== arrangement) setSnapshot({ key: arrangement, progress, starred });

  const cards = state.status === "ready" ? state.set.cards : [];
  const valueOf = (card: Flashcard) => progress[card.text] ?? 0;
  const known = cards.filter((card) => valueOf(card) >= 1).length;
  const average = cards.length ? cards.reduce((sum, c) => sum + valueOf(c), 0) / cards.length : 0;

  const rows = arrange(cards, snapshot, sort, hideKnown).filter((card) =>
    phraseMatches(card.phrase, search),
  );

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
          <SearchField
            label="Search this set"
            placeholder="Search by hanzi, pinyin, or English"
            value={search}
            onChange={setSearch}
          />
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
                  <SortHeader
                    column="star"
                    sort={sort}
                    onSort={setSort}
                    label="Sort by star"
                    className={styles.starHead}
                  >
                    <StarIcon size={14} />
                  </SortHeader>
                  <th className={styles.cardHeadCell}>
                    <div className={styles.cardHead}>
                      <span>Card</span>
                      <Checkbox checked={showPinyin} onChange={setShowPinyin}>
                        Pinyin
                      </Checkbox>
                      <Checkbox checked={showEnglish} onChange={setShowEnglish}>
                        English
                      </Checkbox>
                    </div>
                  </th>
                  <SortHeader
                    column="progress"
                    sort={sort}
                    onSort={setSort}
                    className={styles.progressHead}
                    after={
                      <Checkbox checked={hideKnown} onChange={setHideKnown}>
                        Hide known
                      </Checkbox>
                    }
                  >
                    Progress
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>
                      {search.trim()
                        ? `No cards match “${search.trim()}”.`
                        : "Every card in this set is known."}
                    </td>
                  </tr>
                )}
                {rows.map((card) => (
                  <Row
                    key={card.id}
                    card={card}
                    value={valueOf(card)}
                    starred={starred.has(card.text)}
                    setProgress={setProgress}
                    toggleStar={toggleStar}
                  />
                ))}
              </tbody>
            </Table>
          </AnnotationScope>
          <BackToTop />
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
