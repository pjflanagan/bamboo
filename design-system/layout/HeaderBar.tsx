import type { ReactNode } from "react";
import styles from "./layout.module.css";

type HeaderBarProps = {
  /** Left: home or back link. */
  start?: ReactNode;
  /** Center: the page title. */
  title?: ReactNode;
  /** Right: page actions, menus. */
  end?: ReactNode;
};

/**
 * The sticky top bar, with blur. Just the frame and its three slots; the app
 * decides what goes in them (components/PageHeader).
 */
export function HeaderBar({ start, title, end }: HeaderBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>{start}</div>
      <div className={styles.headerTitle}>{title}</div>
      <div className={styles.headerEnd}>{end}</div>
    </header>
  );
}
