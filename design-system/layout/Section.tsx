import type { ReactNode } from "react";
import styles from "./layout.module.css";

type SectionProps = {
  children: ReactNode;
  title?: ReactNode;
  /** Heading level for the title. */
  titleAs?: "h2" | "h3";
  className?: string;
};

/** A titled block of a page. Consecutive sections are spaced apart. */
export function Section({ children, title, titleAs: Title = "h2", className }: SectionProps) {
  return (
    <section className={className ? `${styles.section} ${className}` : styles.section}>
      {title && <Title className={styles.sectionTitle}>{title}</Title>}
      {children}
    </section>
  );
}
