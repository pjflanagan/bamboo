import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square, for a lone icon. Give the button an aria-label. */
  iconOnly?: boolean;
  className?: string;
};

/**
 * The button look as a class name, for elements that aren't <button>: a
 * next/link Link or an external <a>. The design system doesn't import
 * Next, so links are styled from the outside:
 *
 *   <Link href="/flashcards" className={buttonClassName({ size: "sm" })}>
 */
export function buttonClassName({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  className,
}: ButtonStyleOptions = {}): string {
  return [styles.button, styles[variant], styles[size], iconOnly && styles.iconOnly, className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

/**
 * Primary is the theme's selected look: solid bamboo green, or a glowing
 * neon outline. Secondary is outlined, ghost is text only.
 */
export function Button({
  variant,
  size,
  iconOnly,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, iconOnly, className })}
      {...props}
    />
  );
}
