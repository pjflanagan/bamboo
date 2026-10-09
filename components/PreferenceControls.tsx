"use client";

import {
  HANZI_FONTS,
  HANZI_FONT_LABELS,
  SCRIPTS,
  SCRIPT_LABELS,
  THEME_LABELS,
} from "@/design-system/attributes";
import { SegmentedControl } from "@/design-system/controls";
import { useHanziFont, useScript, useTheme } from "@/hooks";
import { THEME_PREFS } from "@/lib/preferences";
import styles from "./PreferenceControls.module.css";

const themeOptions = THEME_PREFS.map((value) => ({
  value,
  label: value === "system" ? "System" : THEME_LABELS[value],
}));
const fontOptions = HANZI_FONTS.map((value) => ({ value, label: HANZI_FONT_LABELS[value] }));
const scriptOptions = SCRIPTS.map((value) => ({ value, label: SCRIPT_LABELS[value] }));

/**
 * Theme, script, and hanzi font switchers, shown in the header's preferences
 * menu. The font belongs to the theme in use, so its label names the theme.
 */
export function PreferenceControls() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { script, setScript } = useScript();
  const { font, setFont } = useHanziFont();

  return (
    <div className={styles.controls}>
      <SegmentedControl label="Theme" options={themeOptions} value={theme} onChange={setTheme} />
      <SegmentedControl
        label="Script"
        options={scriptOptions}
        value={script}
        onChange={setScript}
      />
      <SegmentedControl
        label={`Hanzi font · ${THEME_LABELS[resolvedTheme]}`}
        options={fontOptions}
        value={font}
        onChange={setFont}
      />
    </div>
  );
}
