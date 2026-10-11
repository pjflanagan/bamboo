"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/design-system/controls";
import {
  BackupError,
  backupFileName,
  collectBackup,
  parseBackup,
  restoreBackup,
} from "@/lib/backup";
import { TRANSFER_PATH, collectTransfer, encodeTransfer } from "@/lib/transfer";
import styles from "./BackupControls.module.css";

async function buildTransferUrl(): Promise<string> {
  return `${location.origin}${TRANSFER_PATH}#${await encodeTransfer(collectTransfer())}`;
}

/**
 * Download everything saved on this device as a file, or load one back:
 * card and zhuyin progress, preferences, the chosen set, and the reader's text.
 * Transfer copies a link that adds this device's progress to another one
 * (lib/transfer).
 */
export function BackupControls() {
  const root = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  // Shown to copy by hand when the clipboard isn't available.
  const [link, setLink] = useState("");
  /*
   * The transfer link, built each time the menu opens. Safari only allows
   * the clipboard and share sheet straight from a click, with nothing
   * awaited first, and compressing the link is async.
   */
  const transferUrl = useRef<string | null>(null);

  useEffect(() => {
    const menu = root.current?.closest("[popover]");
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      transferUrl.current = null;
      void buildTransferUrl().then((url) => (transferUrl.current = url));
    };
    menu?.addEventListener("toggle", onToggle);
    return () => menu?.removeEventListener("toggle", onToggle);
  }, []);

  async function transfer() {
    setLink("");
    const url = transferUrl.current ?? (await buildTransferUrl());
    // Phones: the share sheet (AirDrop, messages) is how a link gets to a computer.
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Bamboo progress", url });
        setStatus("");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. Open it on your other device to add this progress there.");
    } catch {
      setLink(url);
      setStatus("Copy this link and open it on your other device:");
    }
  }

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
    setLink("");
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
    <div ref={root} className={styles.root}>
      <span className={styles.label}>Your data</span>
      <div className={styles.actions}>
        <Button size="sm" onClick={exportData}>
          Export
        </Button>
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          Import
        </Button>
        <Button size="sm" onClick={transfer}>
          Transfer progress
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
      {link && (
        <input
          className={styles.link}
          readOnly
          value={link}
          aria-label="Transfer link"
          onFocus={(event) => event.target.select()}
        />
      )}
    </div>
  );
}
