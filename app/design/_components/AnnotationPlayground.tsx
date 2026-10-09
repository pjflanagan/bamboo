"use client";

import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/design-system/controls";
import {
  AnnotationScope,
  Character,
  LAYERS,
  LAYER_MODES,
  Phrase,
  REVEAL_UNITS,
  Word,
  type AnnotationScopeHandle,
  type HanziSize,
  type Layer,
  type LayerMode,
  type PhraseData,
  type RevealUnit,
} from "@/design-system/hanzi";
import { HANZI_FONTS, HANZI_FONT_LABELS, type HanziFont } from "@/design-system/attributes";
import styles from "../design.module.css";

const modeOptions = LAYER_MODES.map((value) => ({ value, label: value }));
const unitOptions = REVEAL_UNITS.map((value) => ({ value, label: value }));
const sizeOptions = (["sm", "md", "lg", "xl"] as const).map((value) => ({ value, label: value }));
const onOff = [
  { value: "off", label: "off" },
  { value: "on", label: "on" },
] as const;
const fontOptions = [
  { value: "inherit", label: "Preference" },
  ...HANZI_FONTS.map((value) => ({ value, label: HANZI_FONT_LABELS[value] })),
] as const;
const revealedOptions = [
  { value: "none", label: "none" },
  { value: "pinyin", label: "pinyin" },
  { value: "pinyin+english", label: "pinyin + english" },
  { value: "all", label: "all" },
] as const;
type Revealed = (typeof revealedOptions)[number]["value"];

const REVEALED: Record<Revealed, boolean | Layer[]> = {
  none: false,
  pinyin: ["pinyin"],
  "pinyin+english": ["pinyin", "english"],
  all: true,
};

/** Live width × height of an element, to prove toggles never resize it. */
function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState("");
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize(`${width.toFixed(1)} × ${height.toFixed(1)}px`);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function AnnotationPlayground({ phrases }: { phrases: PhraseData[] }) {
  const [modes, setModes] = useState<Record<Layer, LayerMode>>({
    hanzi: "shown",
    pinyin: "shown",
    zhuyin: "shown",
    english: "shown",
  });
  const [revealUnit, setRevealUnit] = useState<RevealUnit>("word");
  const [revealed, setRevealed] = useState<Revealed>("none");
  const [toneColors, setToneColors] = useState<"on" | "off">("off");
  const [size, setSize] = useState<Exclude<HanziSize, number>>("md");
  const [font, setFont] = useState<HanziFont | "inherit">("inherit");
  const scope = useRef<AnnotationScopeHandle>(null);
  const [measured, measuredSize] = useSize();

  return (
    <div className={styles.playground}>
      <div className={styles.controls}>
        {LAYERS.map((layer) => (
          <SegmentedControl
            key={layer}
            label={layer}
            size="sm"
            options={modeOptions}
            value={modes[layer]}
            onChange={(mode) => setModes((current) => ({ ...current, [layer]: mode }))}
          />
        ))}
        <SegmentedControl
          label="Reveal unit"
          size="sm"
          options={unitOptions}
          value={revealUnit}
          onChange={setRevealUnit}
        />
        <SegmentedControl
          label="Revealed by parent"
          size="sm"
          options={revealedOptions}
          value={revealed}
          onChange={setRevealed}
        />
        <SegmentedControl
          label="Tone colors"
          size="sm"
          options={onOff}
          value={toneColors}
          onChange={setToneColors}
        />
        <SegmentedControl
          label="Size"
          size="sm"
          options={sizeOptions}
          value={size}
          onChange={setSize}
        />
        <SegmentedControl
          label="Font"
          size="sm"
          options={fontOptions}
          value={font}
          onChange={setFont}
        />
        <button type="button" onClick={() => scope.current?.clearRevealed()}>
          Clear click reveals
        </button>
      </div>

      <AnnotationScope
        ref={scope}
        {...modes}
        revealUnit={revealUnit}
        revealed={REVEALED[revealed]}
        toneColors={toneColors === "on"}
        size={size}
        font={font === "inherit" ? undefined : font}
      >
        <p className={styles.measure}>
          First phrase box: <code>{measuredSize}</code>
        </p>
        <div className={styles.stage}>
          <div ref={measured} className={styles.measured}>
            <Phrase phrase={phrases[0]} />
          </div>
          {phrases.slice(1).map((phrase, i) => (
            <Phrase key={i} phrase={phrase} />
          ))}
        </div>

        <h3>Standalone</h3>
        <div className={styles.row}>
          <Character syllable={{ trad: "馬", simp: "马", pinyin: "mǎ", zhuyin: "ㄇㄚ", tone: 3 }} />
          <Character
            syllable={{ trad: "們", simp: "们", pinyin: "men", zhuyin: "ㄇㄣ", tone: 5 }}
          />
          <Character
            syllable={{ trad: "窗", simp: "窗", pinyin: "chuāng", zhuyin: "ㄔㄨㄤ", tone: 1 }}
          />
          <Word
            word={{
              english: "cicada",
              tokens: [
                {
                  kind: "hanzi",
                  syllable: { trad: "知", simp: "知", pinyin: "zhī", zhuyin: "ㄓ", tone: 1 },
                },
                {
                  kind: "hanzi",
                  syllable: { trad: "了", simp: "了", pinyin: "liǎo", zhuyin: "ㄌㄧㄠ", tone: 3 },
                },
              ],
            }}
          />
        </div>

        <h3>Nested scope</h3>
        <p className={styles.note}>
          This scope only sets <code>pinyin=&quot;click&quot;</code> and{" "}
          <code>size=&quot;sm&quot;</code>; everything else is inherited from the controls above.
        </p>
        <AnnotationScope pinyin="click" size="sm">
          <Phrase phrase={phrases[1]} />
        </AnnotationScope>
      </AnnotationScope>
    </div>
  );
}
