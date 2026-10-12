"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button, TextArea } from "@/design-system/controls";
import { Modal } from "@/design-system/overlays";
import {
  BackupError,
  backupFileName,
  clearAllData,
  collectBackup,
  parseBackup,
  restoreBackup,
} from "@/lib/backup";
import {
  TRANSFER_PATH,
  TransferError,
  applyTransfer,
  collectTransfer,
  decodeTransfer,
  encodeTransfer,
  transferFragment,
  type TransferData,
} from "@/lib/transfer";
import styles from "./BackupControls.module.css";

const transferUrl = (code: string) => `${location.origin}${TRANSFER_PATH}#${code}`;

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** "12 cards, 3 zhuyin symbols, and 2 starred cards" */
function describeTransfer(data: TransferData): string {
  const parts = [
    plural(Object.keys(data.progress).length, "card"),
    plural(Object.keys(data.zhuyinProgress).length, "zhuyin symbol"),
  ];
  if (data.stars.length > 0) parts.push(plural(data.stars.length, "starred card"));
  return parts.length === 2 ? parts.join(" and ") : `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
}

type Section = "transfer" | "receive" | "backup" | "clear";

/**
 * The preferences menu's Data tab, in three parts:
 *
 * - Transfer: sends this device's progress to another as a link or a code
 *   (lib/transfer), and adds progress from a pasted code or link. It merges,
 *   and only moves progress. Links open in the browser, so an installed app
 *   can only take a code.
 * - Backup: export downloads everything saved on this device as a file, and
 *   import replaces it all with one: card and zhuyin progress, starred
 *   cards, preferences, the chosen set, and the reader's text.
 * - Clear erases all of it.
 */
export function BackupControls() {
  const root = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // The last action's result, shown under the section it came from.
  const [status, setStatus] = useState<{ section: Section; text: string } | null>(null);
  // A link or code to copy by hand when the clipboard isn't available.
  const [manualCopy, setManualCopy] = useState<{ label: string; value: string } | null>(null);
  const [pasted, setPasted] = useState("");
  const [incoming, setIncoming] = useState<TransferData | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  /*
   * The transfer code, built when this tab shows and each time the menu
   * opens. Safari only allows the clipboard and share sheet straight from a
   * click, with nothing awaited first, and compressing the code is async.
   */
  const transferCode = useRef<string | null>(null);

  useEffect(() => {
    const build = () => {
      transferCode.current = null;
      void encodeTransfer(collectTransfer()).then((code) => (transferCode.current = code));
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

  async function send(kind: "link" | "code") {
    setManualCopy(null);
    const code = transferCode.current ?? (await encodeTransfer(collectTransfer()));
    const value = kind === "link" ? transferUrl(code) : code;
    // Phones: the share sheet (AirDrop, messages) is how it gets to another device.
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share(
          kind === "link" ? { title: "Bamboo progress", url: value } : { text: value },
        );
        show("transfer", "");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(value);
      show(
        "transfer",
        kind === "link"
          ? "Link copied. Open it on your other device to add this progress there."
          : "Code copied. Paste it under Add progress on your other device.",
      );
    } catch {
      setManualCopy({ label: kind === "link" ? "Transfer link" : "Transfer code", value });
      show(
        "transfer",
        kind === "link"
          ? "Copy this link and open it on your other device:"
          : "Copy this code and paste it on your other device:",
      );
    }
  }

  async function receive() {
    setManualCopy(null);
    try {
      setIncoming(await decodeTransfer(transferFragment(pasted)));
      show("receive", "");
    } catch (error) {
      show(
        "receive",
        error instanceof TransferError
          ? error.message
          : "That couldn't be read. Try copying it again.",
      );
    }
  }

  function addIncoming() {
    if (!incoming) return;
    applyTransfer(incoming);
    show("receive", `Added ${describeTransfer(incoming)}.`);
    setIncoming(null);
    setPasted("");
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
    setManualCopy(null);
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (!file) return;
    setManualCopy(null);
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
    setManualCopy(null);
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
      <DataSection
        title="Transfer progress"
        hint="Add this device's progress to another one. Nothing there goes backward: each card keeps whichever is further along. Links open in the browser; for the installed app, use a code."
      >
        <div className={styles.actions}>
          <Button size="sm" onClick={() => send("link")}>
            Copy link
          </Button>
          <Button size="sm" onClick={() => send("code")}>
            Copy code
          </Button>
        </div>
        {statusFor("transfer")}
        {manualCopy && (
          <input
            className={styles.link}
            readOnly
            value={manualCopy.value}
            aria-label={manualCopy.label}
            onFocus={(event) => event.target.select()}
          />
        )}

        <form
          className={styles.receive}
          onSubmit={(event) => {
            event.preventDefault();
            void receive();
          }}
        >
          <h4 className={styles.subheading}>Add progress</h4>
          <TextArea
            className={styles.code}
            label="Code or link from another device"
            placeholder="Paste a code or link from another device"
            rows={2}
            value={pasted}
            onChange={setPasted}
          />
          <div className={styles.actions}>
            <Button size="sm" type="submit" disabled={!pasted.trim()}>
              Add progress
            </Button>
          </div>
          {statusFor("receive")}
        </form>
      </DataSection>

      <DataSection
        title="Backup"
        hint="Everything on this device as a file: progress, preferences, and saved text. Importing one replaces what's here."
      >
        <div className={styles.actions}>
          <Button size="sm" onClick={exportData}>
            Export file
          </Button>
          <Button size="sm" onClick={() => fileInput.current?.click()}>
            Import file
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

      <DataSection
        title="Clear data"
        hint="Erase all progress, preferences, and saved text on this device and start fresh."
      >
        <div className={styles.actions}>
          <Button size="sm" onClick={() => setConfirmingClear(true)}>
            Clear data
          </Button>
        </div>
        {statusFor("clear")}
      </DataSection>

      <Modal
        open={incoming !== null}
        onClose={() => setIncoming(null)}
        title="Add progress from another device?"
        description={
          incoming &&
          `${describeTransfer(incoming)}. Progress already here is kept: each card ends up at whichever is further along, and keeps its star.`
        }
        size="sm"
        footer={
          <>
            <Button size="sm" onClick={() => setIncoming(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={addIncoming}>
              Add progress
            </Button>
          </>
        }
      />

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

function DataSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{title}</h3>
      <p className={styles.hint}>{hint}</p>
      {children}
    </section>
  );
}
