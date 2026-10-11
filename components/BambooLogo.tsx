import styles from "./BambooLogo.module.css";

type BambooLogoProps = {
  /** Accessible name; the wordmark itself is an image. */
  label?: string;
  className?: string;
};

/**
 * The bamboo wordmark, from the legacy bamboo-web logo. Drawn as a mask over
 * `currentColor`, so it takes whatever text color it's placed in. Size it
 * with `height` (or font-size: it's 1em tall by default).
 */
export function BambooLogo({ label = "Bamboo", className }: BambooLogoProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={className ? `${styles.logo} ${className}` : styles.logo}
    />
  );
}
