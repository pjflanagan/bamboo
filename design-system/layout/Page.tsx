import type { ReactNode } from "react";
import styles from "./layout.module.css";

type PageProps = {
  children: ReactNode;
  /** default: 720px reading width; wide: 1040px; full: edge to edge. */
  width?: "default" | "wide" | "full";
  className?: string;
};

/** The page's <main>: width, gutters, and bottom breathing room. */
export function Page({ children, width = "default", className }: PageProps) {
  return (
    <main className={className ? `${styles.page} ${className}` : styles.page} data-width={width}>
      {children}
    </main>
  );
}
