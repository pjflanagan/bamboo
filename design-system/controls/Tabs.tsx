"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Tabs.module.css";

export type TabOption<T extends string> = {
  value: T;
  label: ReactNode;
};

type TabsProps<T extends string> = {
  /** Shared with each TabPanel's `tabsId`, which ties tabs and panels together. */
  id: string;
  /** Accessible name for the tab list. */
  label: string;
  tabs: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

const tabId = (id: string, value: string) => `${id}-tab-${value}`;
const panelId = (id: string, value: string) => `${id}-panel-${value}`;

/**
 * A row of tabs. Only the tab list: render the active panel with <TabPanel>
 * wherever it belongs (in a Modal, the tabs sit in the fixed toolbar and the
 * panel in the scrolling body).
 *
 * Keyboard as in the ARIA tabs pattern: one tab stop, arrow keys and
 * Home/End move between tabs and select as they go.
 */
export function Tabs<T extends string>({
  id,
  label,
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const list = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const count = tabs.length;
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(tabs[next].value);
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className={className ? `${styles.list} ${className}` : styles.list}
      onKeyDown={onKeyDown}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={tabId(id, tab.value)}
            aria-selected={selected}
            aria-controls={panelId(id, tab.value)}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

type TabPanelProps = {
  tabsId: string;
  value: string;
  children: ReactNode;
  className?: string;
};

/** The content for one tab, labelled by it. Render only the active one. */
export function TabPanel({ tabsId, value, children, className }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={panelId(tabsId, value)}
      aria-labelledby={tabId(tabsId, value)}
      className={className}
    >
      {children}
    </div>
  );
}
