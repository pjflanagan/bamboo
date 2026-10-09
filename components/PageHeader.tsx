import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/design-system/icons";
import { HeaderBar } from "@/design-system/layout";
import { PreferencesMenu } from "./PreferencesMenu";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  title?: ReactNode;
  /** Where the back arrow goes. Without it, the start slot is the home link. */
  back?: string;
  /** Page-specific controls, shown before the preferences menu. */
  actions?: ReactNode;
};

/**
 * The global header. Each page renders its own, so the title and actions are
 * in the static HTML: no layout-level state, no portals, no flash.
 */
export function PageHeader({ title, back, actions }: PageHeaderProps) {
  const start = back ? (
    <Link href={back} className={styles.iconLink} aria-label="Back">
      <ArrowLeftIcon />
    </Link>
  ) : (
    <Link href="/" className={styles.brand} lang="zh-Hant">
      方昕中文
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
