"use client";

import { useId, type ReactNode } from "react";
import styles from "./SegmentedControl.module.css";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  /** Accessible name for the group. Shown above the control unless hideLabel. */
  label: ReactNode;
  hideLabel?: boolean;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  /** Radio group name. Defaults to a generated id. */
  name?: string;
};

/**
 * One-of-many choice shown as a row of segments.
 *
 * Built on native radio inputs, so arrow keys, focus, and form semantics come
 * from the browser. The inputs are visually hidden; the label is the segment.
 */
export function SegmentedControl<T extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  size = "md",
  name,
}: SegmentedControlProps<T>) {
  const id = useId();
  const groupName = name ?? id;
  const labelId = `${id}-label`;

  return (
    <div className={styles.root} data-size={size}>
      <span id={labelId} className={hideLabel ? styles.srOnly : styles.label}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.track}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              className={styles.input}
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.text}>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
