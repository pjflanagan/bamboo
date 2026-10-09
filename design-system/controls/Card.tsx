import type { CSSProperties, HTMLAttributes } from "react";
import styles from "./Card.module.css";

/** The named swatches in tokens/swatches.css, as used in flashcard CSVs. */
export const CARD_COLORS = [
  "red",
  "dark-red",
  "brown",
  "tan",
  "orange",
  "yellow",
  "lime",
  "green",
  "teal",
  "cyan",
  "light-blue",
  "blue",
  "dark-blue",
  "purple",
  "pink",
  "hot-pink",
  "white",
  "light-grey",
  "grey",
  "dark-grey",
  "black",
] as const;

export type CardColor = (typeof CARD_COLORS)[number];

export function isCardColor(value: unknown): value is CardColor {
  return (CARD_COLORS as readonly unknown[]).includes(value);
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** A swatch name. Without one, the card is the theme's raised surface. */
  color?: CardColor;
};

/**
 * A raised surface. A color tints it with that swatch as the theme decides
 * (--card-<name> in bamboo.css and neon.css) and swaps text and annotation
 * colors to ones that read on it.
 */
export function Card({ color, className, style, ...props }: CardProps) {
  const colorStyle = color
    ? { "--card-bg": `var(--card-${color})`, "--card-fg": `var(--card-${color}-text)` }
    : undefined;
  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      data-colored={color ? "" : undefined}
      style={{ ...colorStyle, ...style } as CSSProperties}
      {...props}
    />
  );
}
