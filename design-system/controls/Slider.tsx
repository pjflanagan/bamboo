"use client";

import type { CSSProperties } from "react";
import styles from "./Slider.module.css";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  /** Accessible name. */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Spoken instead of the raw number, e.g. "40% known". */
  valueText?: string;
  className?: string;
};

/**
 * bamboo-web's slider: a thin filled track with a thumb that grows on hover.
 * A native range input, so dragging, clicking anywhere on the track, arrow
 * keys, and Page Up/Down all come from the browser.
 */
export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  step = 0.01,
  valueText,
  className,
}: SliderProps) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      className={className ? `${styles.slider} ${className}` : styles.slider}
      style={{ "--fill": `${fill}%` } as CSSProperties}
      aria-label={label}
      aria-valuetext={valueText}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
