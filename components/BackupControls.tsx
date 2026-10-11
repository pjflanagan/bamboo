"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/design-system/controls";
import { Modal } from "@/design-system/overlays";
import {
  BackupError,
  backupFileName,
  clearAllData,
  collectBackup,
  parseBackup,
  restoreBackup,
} from "@/lib/backup";
import { TRANSFER_PATH, collectTransfer, encodeTransfer } from "@/lib/transfer";
import styles from "./BackupControls.module.css";

async function buildTransferUrl(): Promise<string> {
  return `${location.origin}${TRANSFER_PATH}#${await encodeTransfer(collectTransfer())}`;
}

type Section = "transfer" | "backup" | "clear";

/**
 * The preferences menu's Data tab. Transfer copies a link that adds this
 * device's progress to another one (lib/transfer). Export downloads
 * everything saved on this device as a file, and import loads one back:
 * card and zhuyin progress, preferences, the chosen set, and the reader's
 * text. Clear erases all of it.
 */
export function BackupControls() {
  const root = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // The last action's result, shown under the section it came from.
  const [status, setStatus] = useState<{ section: Section; text: string } | null>(null);
  // Shown to copy by hand when the clipboard isn't available.
  const [link, setLink] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  /*
   * The transfer link, built when this tab shows and each time the menu
   * opens. Safari only allows the clipboard and share sheet straight from a
   * click, with nothing awaited first, and compressing the link is async.
   */
  const transferUrl = useRef<string | null>(null);

  useEffect(() => {
    const build = () => {
      transferUrl.current = null;
      void buildTransferUrl().then((url) => (transferUrl.current = url));
    };
    const menu = root.current?.closest("[popover]");
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "open") build();
    };
    build();
    menu?.addEventListener("toggle", onToggle);
    return () => menu?.removeEventListener("toggle", onToggle);
  }, []);

  function show(section: Section, text: string) {
    setStatus(text ? { section, text } : null);
  }

  async function transfer() {
    setLink("");
    const url = transferUrl.current ?? (await buildTransferUrl());
    // Phones: the share sheet (AirDrop, messages) is how a link gets to a computer.
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Bamboo progress", url });
        show("transfer", "");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      show("transfer", "Link copied. Open it on your other device to add this progress there.");
    } catch {
      setLink(url);
      show("transfer", "Copy this link and open it on your other device:");
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
    show("backup", "");
    setLink("");
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (!file) return;
    setLink("");
    try {
      const data = parseBackup(await file.text());
      if (!confirm("Replace this device's progress and preferences with the backup's?")) return;
      restoreBackup(data);
      show("backup", "Backup restored.");
    } catch (error) {
      show("backup", error instanceof BackupError ? error.message : "That file couldn't be read.");
    }
  }

  function clearData() {
    clearAllData();
    setConfirmingClear(false);
    setLink("");
    show("clear", "All data cleared.");
  }

  const statusFor = (section: Section) =>
    status?.section === section && (
      <p className={styles.status} role="status">
        {status.text}
      </p>
    );

  return (
    <div ref={root} className={styles.root}>
      <DataSection hint="Send your progress to another device with a link. Opening it there adds this device's progress to it.">
        <div className={styles.actions}>
          <Button size="sm" onClick={transfer}>
            Transfer progress
          </Button>
        </div>
        {statusFor("transfer")}
        {link && (
          <input
            className={styles.link}
            readOnly
            value={link}
            aria-label="Transfer link"
            onFocus={(event) => event.target.select()}
          />
        )}
      </DataSection>

      <DataSection hint="Or download your data as a file, then upload it to restore it here or on another device.">
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
        {statusFor("backup")}
      </DataSection>

      <DataSection hint="Erase all progress, preferences, and saved text on this device and start fresh.">
        <div className={styles.actions}>
          <Button size="sm" onClick={() => setConfirmingClear(true)}>
            Clear data
          </Button>
        </div>
        {statusFor("clear")}
      </DataSection>

      <Modal
        open={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        title="Clear all data?"
        description="This erases your card and zhuyin progress, preferences, and saved text on this device. It can't be undone, so export a backup first if you might want it back."
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setConfirmingClear(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={clearData}>
              Clear data
            </Button>
          </>
        }
      />
    </div>
  );
}

function DataSection({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <p className={styles.hint}>{hint}</p>
      {children}
    </section>
  );
}
