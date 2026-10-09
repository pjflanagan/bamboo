"use client";

import { useState } from "react";
import { Checkbox } from "@/design-system/controls";
import type { ZhuyinChart as Chart } from "@/lib/data";
import styles from "./ZhuyinChart.module.css";

/** Recordings of each symbol, from MDN Kids, numbered in their order. */
const AUDIO_BASE = "https://www.mdnkids.com/BoPoMo/audio/";
const AUDIO_ORDER = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ";

function play(zhuyin: string) {
  const index = AUDIO_ORDER.indexOf(zhuyin);
  if (index < 0) return;
  const audio = new Audio(`${AUDIO_BASE}${String(index + 1).padStart(2, "0")}.mp3`);
  audio.play().catch(() => {}); // blocked or offline: nothing to play
}

/** The chart's columns: four of initials, the medials, four of finals. */
function groupOf(column: number): "initial" | "medial" | "final" {
  if (column < 4) return "initial";
  return column === 4 ? "medial" : "final";
}

const LEGEND = [
  { group: "initial", label: "Initials" },
  { group: "medial", label: "Medials" },
  { group: "final", label: "Finals" },
] as const;

/**
 * Every zhuyin symbol in the classroom layout, colored by kind. Each symbol
 * is a button that plays its sound; the pinyin under it can be hidden to
 * quiz yourself.
 */
export function ZhuyinChart({ chart }: { chart: Chart }) {
  const [showPinyin, setShowPinyin] = useState(true);

  return (
    <div className={styles.chart}>
      <div className={styles.options}>
        <Checkbox checked={showPinyin} onChange={setShowPinyin}>
          Pinyin
        </Checkbox>
        <ul className={styles.legend}>
          {LEGEND.map(({ group, label }) => (
            <li key={group} data-group={group}>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.grid} data-pinyin={showPinyin || undefined}>
        {chart.flatMap((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <button
                key={`${r}-${c}`}
                type="button"
                className={styles.cell}
                data-group={groupOf(c)}
                aria-label={`${cell.zhuyin}, ${cell.pinyin}: play`}
                onClick={() => play(cell.zhuyin)}
              >
                <span className={styles.zhuyin} lang="zh-Hant">
                  {cell.zhuyin}
                </span>
                <span className={styles.pinyin}>{cell.pinyin}</span>
              </button>
            ) : (
              <span
                key={`${r}-${c}`}
                className={styles.cell}
                data-group={groupOf(c)}
                data-empty
                aria-hidden
              />
            ),
          ),
        )}
      </div>

      <p className={styles.attribution}>
        Audio from{" "}
        <a href="https://www.mdnkids.com/BoPoMo/" target="_blank" rel="noreferrer">
          MDN Kids
        </a>
      </p>
    </div>
  );
}
