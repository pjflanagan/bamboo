import type { CSSProperties, ReactNode } from "react";
import { seededHues } from "./hue";
import styles from "./motifs.module.css";

type SignProps = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "div" | "span";
  /** double: the outer-and-inner frame of study-mandarin's page title. */
  variant?: "single" | "double";
  /** Picks the neon hues. Defaults to the text, so each heading keeps its colors. */
  seed?: string;
  className?: string;
};

/**
 * The signature heading. Neon renders a glowing sign; bamboo renders the
 * text over a bamboo-stalk underline. Pages never branch on theme: the theme
 * tokens (--sign-*) decide which parts show.
 */
export function Sign({ children, as: Tag = "h2", variant = "single", seed, className }: SignProps) {
  const { hue, textHue } = seededHues(seed ?? (typeof children === "string" ? children : "sign"));
  const style = { "--sign-hue": hue, "--sign-text-hue": textHue } as CSSProperties;
  const classes = [styles.sign, className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} data-variant={variant} style={style}>
      {variant === "double" ? <span className={styles.signInner}>{children}</span> : children}
    </Tag>
  );
}
