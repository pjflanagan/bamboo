"use client";

import { Button } from "@/design-system/controls";
import { ArrowRightIcon } from "@/design-system/icons";
import { MODE_ORDER, modeLabel, type Mode } from "./FlashcardDeck";
import styles from "./ModeButton.module.css";

type ModeButtonProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

/**
 * The study mode as one button that reads as the mode itself, and cycles on
 * each press:
 *
 *   漢字 → English + 拼音
 *   漢字 + 拼音 → English
 *   漢字 + 拼音 ← English
 *
 * The same pieces stay mounted in every mode, so the change animates: 拼音
 * slides from one side of the arrow to the other, and the arrow turns around.
 */
export function ModeButton({ mode, onChange }: ModeButtonProps) {
  const next = MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length];

  return (
    <Button
      size="sm"
      className={styles.mode}
      data-mode={mode}
      aria-label={`Study mode: ${modeLabel(mode)}. Change mode`}
      title={`Switch to ${modeLabel(next)}`}
      onClick={() => onChange(next)}
    >
      <span lang="zh-Hant">漢字</span>
      <span className={styles.slot} data-side="front" lang="zh-Hant">
        <span> + 拼音</span>
      </span>
      <span className={styles.arrow}>
        <ArrowRightIcon size={14} />
      </span>
      <span>English</span>
      <span className={styles.slot} data-side="back" lang="zh-Hant">
        <span> + 拼音</span>
      </span>
    </Button>
  );
}
