"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/design-system/controls";
import { ArrowUpIcon } from "@/design-system/icons";
import styles from "./BackToTop.module.css";

/** How far down the page (in px) before the button shows. */
const THRESHOLD = 600;

function subscribeToScroll(listener: () => void) {
  window.addEventListener("scroll", listener, { passive: true });
  return () => window.removeEventListener("scroll", listener);
}

/** A floating button, on long pages once they're scrolled, that goes back to the top. */
export function BackToTop() {
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > THRESHOLD,
    () => false,
  );
  if (!scrolled) return null;

  const toTop = () => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <Button iconOnly className={styles.button} aria-label="Back to top" onClick={toTop}>
      <ArrowUpIcon />
    </Button>
  );
}
