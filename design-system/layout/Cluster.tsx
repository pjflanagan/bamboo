import type { CSSProperties, ElementType, ReactNode } from "react";
import styles from "./layout.module.css";
import type { Space } from "./Stack";

type ClusterProps = {
  children: ReactNode;
  gap?: Space;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  as?: ElementType;
  className?: string;
};

/** Children in a row that wraps, evenly spaced: tags, buttons, controls. */
export function Cluster({
  children,
  gap = 3,
  align,
  justify,
  as: Tag = "div",
  className,
}: ClusterProps) {
  return (
    <Tag
      className={className ? `${styles.cluster} ${className}` : styles.cluster}
      style={
        { "--gap": `var(--space-${gap})`, "--align": align, "--justify": justify } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
