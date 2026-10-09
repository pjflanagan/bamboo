"use client";

import { useId, useState } from "react";
import { TabPanel, Tabs, buttonClassName } from "@/design-system/controls";
import { Modal } from "@/design-system/overlays";
import type { FlashcardCatalog } from "@/lib/data";
import styles from "./SetPicker.module.css";

type Tab = "unit" | "class";

const TABS = [
  { value: "unit", label: "Unit" },
  { value: "class", label: "Class" },
] as const;

type SetPickerProps = {
  open: boolean;
  onClose: () => void;
  catalog: FlashcardCatalog;
  /** The set being studied, highlighted in the list. */
  current: string | null;
  onSelect: (slug: string) => void;
};

/** Choose a set: Unit sets (structures, sourced lists) or Class sets by topic. */
export function SetPicker({ open, onClose, catalog, current, onSelect }: SetPickerProps) {
  const tabsId = useId();
  const tabOf = (slug: string | null): Tab =>
    catalog.classTopics.some((topic) => topic.sets.some((set) => set.slug === slug))
      ? "class"
      : "unit";
  const [tab, setTab] = useState<Tab>(() => tabOf(current));
  // Each time it opens, start on the tab that holds the current set.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTab(tabOf(current));
  }

  const choose = (slug: string) => {
    onSelect(slug);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose a set"
      size="sm"
      toolbar={<Tabs id={tabsId} label="Set type" tabs={TABS} value={tab} onChange={setTab} />}
    >
      <TabPanel tabsId={tabsId} value={tab}>
        {tab === "unit" ? (
          <div className={styles.groups}>
            {catalog.collections.map((collection) => (
              <section key={collection.title}>
                <h3 className={styles.groupTitle}>{collection.title}</h3>
                <ul className={styles.sets}>
                  {collection.sets.map((set) => (
                    <li key={set.slug}>
                      <button
                        type="button"
                        className={styles.set}
                        aria-current={set.slug === current || undefined}
                        onClick={() => choose(set.slug)}
                      >
                        <span className={styles.setTitle}>{set.title}</span>
                        {set.description && (
                          <span className={styles.description}>{set.description}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className={styles.topics}>
            {catalog.classTopics.map((topic) => (
              <li key={topic.title} className={styles.topic}>
                <span className={styles.topicTitle}>{topic.title}</span>
                <span className={styles.numbers}>
                  {topic.sets.map((set, i) => (
                    <button
                      key={set.slug}
                      type="button"
                      aria-label={set.title}
                      aria-current={set.slug === current || undefined}
                      className={buttonClassName({
                        variant: set.slug === current ? "primary" : "secondary",
                        size: "sm",
                        className: styles.number,
                      })}
                      onClick={() => choose(set.slug)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>
    </Modal>
  );
}
