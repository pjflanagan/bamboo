"use client";

import { useId, useState } from "react";
import { TabPanel, Tabs } from "@/design-system/controls";
import { SlidersIcon } from "@/design-system/icons";
import { BackupControls } from "./BackupControls";
import { PreferenceControls } from "./PreferenceControls";
import styles from "./PreferencesMenu.module.css";

type Tab = "appearance" | "data";

const TABS = [
  { value: "appearance", label: "Appearance" },
  { value: "data", label: "Data" },
] as const;

/**
 * Header button that opens the preferences: appearance and data tabs. Uses
 * the native popover attribute: light-dismiss, Escape to close, and
 * top-layer stacking for free.
 */
export function PreferencesMenu() {
  const id = useId();
  const tabsId = useId();
  const [tab, setTab] = useState<Tab>("appearance");

  return (
    <>
      <button type="button" className={styles.trigger} popoverTarget={id} aria-label="Preferences">
        <SlidersIcon />
      </button>
      <div id={id} popover="auto" className={styles.panel} aria-label="Preferences">
        <Tabs id={tabsId} label="Preferences" tabs={TABS} value={tab} onChange={setTab} />
        <TabPanel tabsId={tabsId} value={tab} className={styles.tabPanel}>
          {tab === "appearance" ? <PreferenceControls /> : <BackupControls />}
        </TabPanel>
      </div>
    </>
  );
}
