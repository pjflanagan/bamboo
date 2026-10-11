import Link from "next/link";
import type { ReactNode } from "react";
import { HeaderBar } from "@/design-system/layout";
import { BambooLogo } from "./BambooLogo";
import { PreferencesMenu } from "./PreferencesMenu";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  /**
   * Without a title (the home page), the start slot is empty: the page shows
   * the logo itself. Elsewhere it's the logo, linking home.
   */
  title?: ReactNode;
  /** Page-specific controls, shown before the preferences menu. */
  actions?: ReactNode;
};

/**
 * The global header. Each page renders its own, so the title and actions are
 * in the static HTML: no layout-level state, no portals, no flash.
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  const start = title && (
    <Link href="/" className={styles.brand}>
      <BambooLogo label="Bamboo home" />
    </Link>
  );

  return (
    <HeaderBar
      start={start}
      title={title}
      end={
        <>
          {actions}
          <PreferencesMenu />
        </>
      }
    />
  );
}
