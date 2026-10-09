"use client";

import type { ReactNode } from "react";
import styles from "./Checkbox.module.css";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label. May contain a link: clicking the link follows it, clicking the rest toggles. */
  children: ReactNode;
  /** To-do style: strike the label through once checked. */
  strike?: boolean;
  className?: string;
};

/** A native checkbox with its label. With `strike`, checked items are struck through like a to-do list. */
export function Checkbox({
  checked,
  onChange,
  children,
  strike = false,
  className,
}: CheckboxProps) {
  return (
    <label
      className={className ? `${styles.checkbox} ${className}` : styles.checkbox}
      data-strike={strike || undefined}
    >
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.label}>{children}</span>
    </label>
  );
}
