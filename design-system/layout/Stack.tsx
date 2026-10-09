import type { CSSProperties, ElementType, ReactNode } from "react";
import styles from "./layout.module.css";

/** Steps of the --space-* scale. */
export type Space = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

type StackProps = {
  children: ReactNode;
  gap?: Space;
  as?: ElementType;
  className?: string;
};

/** Children in a column, evenly spaced. */
export function Stack({ children, gap = 4, as: Tag = "div", className }: StackProps) {
  return (
    <Tag
      className={className ? `${styles.stack} ${className}` : styles.stack}
      style={{ "--gap": `var(--space-${gap})` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
