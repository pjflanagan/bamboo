"use client";

import { useId } from "react";
import { SlidersIcon } from "@/design-system/icons";
import { AnnotationDefaultsControls } from "./AnnotationDefaultsControls";
import { PreferenceControls } from "./PreferenceControls";
import styles from "./PreferencesMenu.module.css";

/**
 * Header button that opens the display preferences. Uses the native popover
 * attribute: light-dismiss, Escape to close, and top-layer stacking for free.
 */
export function PreferencesMenu() {
  const id = useId();

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget={id}
        aria-label="Display preferences"
      >
        <SlidersIcon />
      </button>
      <div id={id} popover="auto" className={styles.panel} aria-label="Display preferences">
        <h2 className={styles.heading}>Display</h2>
        <PreferenceControls />
        <h2 className={styles.heading}>Annotations</h2>
        <p className={styles.hint}>Where a page doesn&apos;t choose for itself.</p>
        <AnnotationDefaultsControls />
      </div>
    </>
  );
}
