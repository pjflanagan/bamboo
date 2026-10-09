import type { TableHTMLAttributes } from "react";
import styles from "./Table.module.css";

/**
 * A data table: muted small-caps header, ruled rows that highlight on hover.
 * Plain <table> markup inside (thead, tbody, tr, th, td), styled here.
 */
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={className ? `${styles.table} ${className}` : styles.table} {...props} />;
}
