"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import styles from "./Tooltip.module.css";

type TooltipProps = {
  /** What the bubble says. */
  content: ReactNode;
  /** The text it explains. */
  children: ReactNode;
  /**
   * Whether the trigger takes keyboard focus. Turn off inside a link or
   * button, which is focusable itself (nested focus stops are invalid).
   */
  focusable?: boolean;
  className?: string;
};

/**
 * A small bubble above some text, on hover, focus, or tap. Escape hides it.
 * The bubble describes the trigger (aria-describedby), so screen readers
 * read it after the text without a hover.
 */
export function Tooltip({ content, children, focusable = true, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <span
      className={className ? `${styles.trigger} ${className}` : styles.trigger}
      tabIndex={focusable ? 0 : undefined}
      aria-describedby={id}
      data-open={open || undefined}
      // Mouse: hover. Touch and pen: tap to toggle (a tap also fires
      // pointerenter, so hover can't be the trigger for them).
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(false)}
      onPointerDown={(event) => event.pointerType !== "mouse" && setOpen((value) => !value)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span role="tooltip" id={id} className={styles.bubble}>
        {content}
      </span>
    </span>
  );
}
