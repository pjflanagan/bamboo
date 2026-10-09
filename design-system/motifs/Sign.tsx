import type { CSSProperties, ReactNode } from "react";
import { seededHues } from "./hue";
import styles from "./motifs.module.css";

type SignProps = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "div" | "span";
  /** For in-page links (#videos). */
  id?: string;
  /**
   * single: one glowing frame. double: the outer-and-inner frame of
   * study-mandarin's page title. text: glowing text without a frame, for
   * subheadings (plain text in bamboo).
   */
  variant?: "single" | "double" | "text";
  /**
   * Pins the neon hues to ones derived from this string. Without it the
   * sign turns the page's --random-hue (new on every load in this app) by an
   * offset from its text: signs differ from each other and change on reload.
   */
  seed?: string;
  className?: string;
};

/**
 * The signature heading. Neon renders a glowing sign; bamboo renders the
 * text over a bamboo-stalk underline. Pages never branch on theme: the theme
 * tokens (--sign-*) decide which parts show.
 */
export function Sign({
  children,
  as: Tag = "h2",
  variant = "single",
  seed,
  id,
  className,
}: SignProps) {
  const text = typeof children === "string" ? children : "sign";
  const { hue, textHue } = seededHues(seed ?? text);
  const vars: Record<string, number> =
    seed !== undefined
      ? { "--sign-hue": hue, "--sign-text-hue": textHue }
      : // The text hue's offset from the frame is 80-280deg, as seeded.
        { "--sign-offset": hue, "--sign-text-offset": (textHue - hue + 360) % 360 };
  const style = vars as CSSProperties;
  const classes = [styles.sign, className].filter(Boolean).join(" ");

  return (
    <Tag id={id} className={classes} data-variant={variant} style={style}>
      {variant === "double" ? <span className={styles.signInner}>{children}</span> : children}
    </Tag>
  );
}
