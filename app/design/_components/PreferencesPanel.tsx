"use client";

import { SegmentedControl } from "@/design-system/controls";
import {
  HANZI_FONTS,
  HANZI_FONT_LABELS,
  SCRIPTS,
  THEME_PREFS,
  usePreferences,
} from "@/design-system/preferences";
import styles from "../design.module.css";

const THEME_LABELS = { system: "System", neon: "Neon", bamboo: "Bamboo" } as const;
const SCRIPT_LABELS = { trad: "繁 Traditional", simp: "简 Simplified" } as const;

const themeOptions = THEME_PREFS.map((value) => ({ value, label: THEME_LABELS[value] }));
const fontOptions = HANZI_FONTS.map((value) => ({ value, label: HANZI_FONT_LABELS[value] }));
const scriptOptions = SCRIPTS.map((value) => ({ value, label: SCRIPT_LABELS[value] }));

/**
 * Preference switcher for developing the design system. The same controls
 * move into the global header menu in step 4.
 */
export function PreferencesPanel() {
  const { theme, font, script, setPreference } = usePreferences();

  return (
    <div className={styles.panel}>
      <SegmentedControl
        label="Theme"
        options={themeOptions}
        value={theme}
        onChange={(value) => setPreference("theme", value)}
      />
      <SegmentedControl
        label="Hanzi font"
        options={fontOptions}
        value={font}
        onChange={(value) => setPreference("font", value)}
      />
      <SegmentedControl
        label="Script"
        options={scriptOptions}
        value={script}
        onChange={(value) => setPreference("script", value)}
      />
    </div>
  );
}
