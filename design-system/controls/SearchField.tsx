"use client";

import styles from "./SearchField.module.css";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. */
  label: string;
  placeholder?: string;
  className?: string;
};

/** A one-line search box. Filtering as it changes is the caller's job. */
export function SearchField({ value, onChange, label, placeholder, className }: SearchFieldProps) {
  return (
    <input
      type="search"
      className={className ? `${styles.field} ${className}` : styles.field}
      aria-label={label}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
