import type { CSSProperties } from "react";
import styles from "./ProgressBar.module.css";

type ProgressBarProps = {
  /** 0 to 1. Clamped. */
  value: number;
  /** Accessible name, e.g. "Cards known". */
  label: string;
  className?: string;
};

/**
 * bamboo-web's progress bar: a hard-stop fill over a pale track. Glows in
 * neon.
 */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={className ? `${styles.track} ${className}` : styles.track}
      style={{ "--progress": `${percent}%` } as CSSProperties}
    />
  );
}
