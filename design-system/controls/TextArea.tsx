"use client";

import styles from "./TextArea.module.css";

type TextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. */
  label: string;
  placeholder?: string;
  rows?: number;
  lang?: string;
  className?: string;
};

/** A multi-line text field that grows with its content (where supported). */
export function TextArea({
  value,
  onChange,
  label,
  placeholder,
  rows = 3,
  lang,
  className,
}: TextAreaProps) {
  return (
    <textarea
      className={className ? `${styles.textarea} ${className}` : styles.textarea}
      aria-label={label}
      placeholder={placeholder}
      rows={rows}
      lang={lang}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
