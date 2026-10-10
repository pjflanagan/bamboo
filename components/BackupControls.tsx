"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/design-system/controls";
import {
  BackupError,
  backupFileName,
  collectBackup,
  parseBackup,
  restoreBackup,
} from "@/lib/backup";
import styles from "./BackupControls.module.css";

/**
 * Download everything saved on this device as a file, or load one back:
 * card and zhuyin progress, preferences, the chosen set, and the reader's text.
 */
export function BackupControls() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  function exportData() {
    const blob = new Blob([JSON.stringify(collectBackup(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
    setStatus("");
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      if (!confirm("Replace this device's progress and preferences with the backup's?")) return;
      restoreBackup(data);
      setStatus("Backup restored.");
    } catch (error) {
      setStatus(error instanceof BackupError ? error.message : "That file couldn't be read.");
    }
  }

  return (
    <div className={styles.root}>
      <span className={styles.label}>Your data</span>
      <div className={styles.actions}>
        <Button size="sm" onClick={exportData}>
          Export
        </Button>
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          Import
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={importData}
        />
      </div>
      <p className={styles.status} role="status">
        {status}
      </p>
    </div>
  );
}
