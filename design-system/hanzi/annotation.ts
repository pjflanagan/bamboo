import type { CSSProperties } from "react";
import type { HanziFont, Script } from "@/design-system/attributes";
import { LAYERS, type Layer } from "./types";

/**
 * How one annotation layer behaves inside a scope.
 *
 * - shown      always visible
 * - hidden     invisible, space reserved; only a parent `revealed` shows it
 * - hover      hidden until the reveal unit is hovered (tap on touch screens)
 * - click      hidden until the reveal unit is clicked, tapped, or activated
 *              with Enter/Space; toggles
 * - collapsed  removed along with its space, for dense layouts
 *
 * Every mode except `collapsed` reserves the layer's space, so switching
 * between them never changes a unit's size.
 */
export type LayerMode = "shown" | "hidden" | "hover" | "click" | "collapsed";
export const LAYER_MODES = ["shown", "hidden", "hover", "click", "collapsed"] as const;

/** Which element a hover or click reveals: one character, its word, or the phrase. */
export type RevealUnit = "character" | "word" | "phrase";
export const REVEAL_UNITS = ["character", "word", "phrase"] as const;

export type HanziSize = "sm" | "md" | "lg" | "xl" | number;

export const HANZI_SIZES: Record<Exclude<HanziSize, number>, string> = {
  sm: "1.5rem",
  md: "2.5rem",
  lg: "3.5rem",
  xl: "5rem",
};

export type AnnotationConfig = Partial<Record<Layer, LayerMode>> & {
  revealUnit?: RevealUnit;
  /**
   * Parent instruction: reveal hidden layers regardless of mode. `true`
   * reveals all, an array reveals those layers (e.g. ["pinyin"] then
   * ["pinyin", "english"] for step-by-step quizzes).
   */
  revealed?: boolean | readonly Layer[];
  /** Color hanzi, pinyin, and zhuyin by tone. */
  toneColors?: boolean;
  /** Override the user's script preference for this subtree. */
  script?: Script;
  /** Override the user's hanzi font preference for this subtree. */
  font?: HanziFont;
  size?: HanziSize;
};

/**
 * Inner scopes override only what they specify. Everything else, including
 * `revealed`, is inherited from the nearest enclosing scope.
 */
export function mergeConfig(parent: AnnotationConfig, child: AnnotationConfig): AnnotationConfig {
  const merged: AnnotationConfig = { ...parent };
  for (const [key, value] of Object.entries(child)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

export function sizeValue(size: HanziSize): string {
  return typeof size === "number" ? `${size}px` : HANZI_SIZES[size];
}

const VISIBLE = "visible";
/** A custom property set to `initial` is "unset", so var() falls back. */
const UNSET = "initial";

const HOVER_VAR: Record<RevealUnit, string> = { character: "hc", word: "hw", phrase: "hp" };

/**
 * The custom properties a scope sets on itself. Slots in hanzi.module.css
 * read these through var() fallback chains, and custom properties inherit,
 * so the nearest scope always wins without any descendant selectors.
 *
 * Per layer L:
 *   --base-L    visible | hidden          resting visibility
 *   --track-L   0px | (unset)             collapses the layer's grid track
 *   --hc/hw/hp-L  visible | (unset)       revealed when that unit is hovered
 *   --k-L       visible | (unset)         revealed when the unit is clicked
 *   --kt-L      visible | (unset)         revealed on tap (touch, no hover)
 *   --rev-L     visible | (unset)         revealed by the parent
 */
export function scopeStyle(config: AnnotationConfig): CSSProperties {
  const style: Record<string, string> = {};
  const unit = config.revealUnit ?? "word";

  for (const layer of LAYERS) {
    const mode = config[layer];
    const revealed =
      config.revealed === true ||
      (Array.isArray(config.revealed) && config.revealed.includes(layer));
    style[`--rev-${layer}`] = revealed ? VISIBLE : UNSET;

    // Unspecified layers fall through to the user's defaults (set on <html>).
    if (!mode) continue;
    style[`--base-${layer}`] = mode === "shown" ? VISIBLE : "hidden";
    style[`--track-${layer}`] = mode === "collapsed" ? "0px" : UNSET;
    for (const level of REVEAL_UNITS) {
      style[`--${HOVER_VAR[level]}-${layer}`] =
        mode === "hover" && unit === level ? VISIBLE : UNSET;
    }
    style[`--k-${layer}`] = mode === "click" ? VISIBLE : UNSET;
    style[`--kt-${layer}`] = mode === "click" || mode === "hover" ? VISIBLE : UNSET;
  }

  if (config.toneColors !== undefined) style["--tone-mix"] = config.toneColors ? "100%" : "0%";
  if (config.size !== undefined) style["--hanzi-size"] = sizeValue(config.size);
  return style as CSSProperties;
}

/** Whether units at `unit` level respond to clicks in this config. */
export function isClickable(config: AnnotationConfig, unit: RevealUnit): boolean {
  if ((config.revealUnit ?? "word") !== unit) return false;
  return LAYERS.some((layer) => config[layer] === "click");
}

/** Whether units at `unit` level respond to taps on touch screens. */
export function isTappable(config: AnnotationConfig, unit: RevealUnit): boolean {
  if ((config.revealUnit ?? "word") !== unit) return false;
  return LAYERS.some((layer) => config[layer] === "click" || config[layer] === "hover");
}
