"use client";

import {
  DEFAULT_LAYERS,
  DEFAULT_LAYER_LABELS,
  DEFAULT_LAYER_MODES,
  DEFAULT_LAYER_MODE_LABELS,
} from "@/design-system/attributes";
import { SegmentedControl } from "@/design-system/controls";
import { useAnnotationDefaults } from "@/hooks";
import styles from "./PreferenceControls.module.css";

const modeOptions = DEFAULT_LAYER_MODES.map((value) => ({
  value,
  label: DEFAULT_LAYER_MODE_LABELS[value],
}));

/** Show / hover / hide for pinyin, zhuyin, and English, wherever a page doesn't decide. */
export function AnnotationDefaultsControls() {
  const { defaults, setDefault } = useAnnotationDefaults();

  return (
    <div className={styles.controls}>
      {DEFAULT_LAYERS.map((layer) => (
        <SegmentedControl
          key={layer}
          label={DEFAULT_LAYER_LABELS[layer]}
          size="sm"
          options={modeOptions}
          value={defaults[layer]}
          onChange={(mode) => setDefault(layer, mode)}
        />
      ))}
    </div>
  );
}
