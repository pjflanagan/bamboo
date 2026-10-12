"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./layout.module.css";
import type { Space } from "./Stack";

type MasonryProps = {
  children: ReactNode;
  gap?: Space;
  /** As many columns as fit at this width or wider: a CSS length. */
  minWidth?: string;
  className?: string;
};

/**
 * Children packed into equal columns, each tucked under the one above it
 * instead of waiting for the tallest in its row.
 *
 * It starts (and prerenders) as a plain grid, which decides how many columns
 * fit. Once in the browser, each child in turn goes to whichever column is
 * shortest, so the order still reads left to right. Real column elements,
 * not CSS multi-column, which breaks blurred cards and tooltips in Safari.
 */
export function Masonry({ children, gap = 4, minWidth = "15rem", className }: MasonryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  /** Indices of the children in each column; null until measured. */
  const [columns, setColumns] = useState<number[][] | null>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const arrange = () => {
      const style = getComputedStyle(grid);
      const tracks = style.gridTemplateColumns.split(" ").length;
      const rowGap = parseFloat(style.rowGap) || 0;
      const cells = [
        ...grid.querySelectorAll<HTMLElement>(":scope > [data-cell], :scope > * > [data-cell]"),
      ];
      const heights = new Map(cells.map((cell) => [Number(cell.dataset.cell), cell.offsetHeight]));

      const count = Math.max(1, Math.min(tracks, heights.size));
      const next: number[][] = Array.from({ length: count }, () => []);
      const filled = next.map(() => 0);
      for (let index = 0; index < heights.size; index++) {
        const shortest = filled.indexOf(Math.min(...filled));
        next[shortest].push(index);
        filled[shortest] += (heights.get(index) ?? 0) + rowGap;
      }
      setColumns((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };

    // Fires once on observing, then when the width or any child's height changes.
    const observer = new ResizeObserver(arrange);
    observer.observe(grid);
    for (const cell of grid.querySelectorAll("[data-cell]")) observer.observe(cell);
    return () => observer.disconnect();
    // Arranging moves the children to new elements, which need observing again.
  }, [columns, items.length]);

  const cell = (index: number) => (
    <div key={index} data-cell={index}>
      {items[index]}
    </div>
  );

  return (
    <div
      ref={ref}
      className={className ? `${styles.masonry} ${className}` : styles.masonry}
      style={{ "--gap": `var(--space-${gap})`, "--min-width": minWidth } as CSSProperties}
    >
      {columns
        ? columns.map((column, index) => (
            <div key={index} className={styles.masonryColumn}>
              {column.filter((item) => item < items.length).map(cell)}
            </div>
          ))
        : items.map((_, index) => cell(index))}
    </div>
  );
}
