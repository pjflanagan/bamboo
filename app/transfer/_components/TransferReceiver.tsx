"use client";

import Link from "next/link";
import { Suspense, use, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button, Card, buttonClassName } from "@/design-system/controls";
import { TransferError, applyTransfer, decodeTransfer, type TransferData } from "@/lib/transfer";
import styles from "./TransferReceiver.module.css";

type Decoded = { data: TransferData } | { error: string };

/** One decode per fragment, so `use` sees the same promise on every render. */
const decodes = new Map<string, Promise<Decoded>>();

function decodeOnce(fragment: string): Promise<Decoded> {
  let decoded = decodes.get(fragment);
  if (!decoded) {
    decoded = decodeTransfer(fragment).then(
      (data) => ({ data }),
      (error) => ({
        error: error instanceof TransferError ? error.message : "This link couldn't be read.",
      }),
    );
    decodes.set(fragment, decoded);
  }
  return decoded;
}

function subscribeToHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/**
 * The receiving end of a transfer link. The progress is in the URL's
 * fragment, which only the browser sees, so prerendering shows a placeholder
 * and the link is read once the page hydrates.
 */
export function TransferReceiver() {
  const fragment = useSyncExternalStore(
    subscribeToHash,
    () => location.hash,
    () => null,
  );
  const [added, setAdded] = useState(false);

  if (added) {
    return (
      <Card className={styles.card}>
        <h2 className={styles.title}>Progress added</h2>
        <p>Your progress from the other device is now on this one too.</p>
        <div className={styles.actions}>
          <Link href="/flashcards" className={buttonClassName({ variant: "primary" })}>
            Flashcards
          </Link>
          <Link href="/" className={buttonClassName({ variant: "ghost" })}>
            Home
          </Link>
        </div>
      </Card>
    );
  }
  if (fragment === null) return <Card className={styles.card} aria-busy />;
  if (!fragment) {
    return (
      <Message title="No progress in this link">
        On the device with your progress, open the preferences menu (top right) and choose Transfer
        progress. Then open the copied link here.
      </Message>
    );
  }
  return (
    <Suspense fallback={<Card className={styles.card} aria-busy />}>
      <Review decoded={decodeOnce(fragment)} onAdded={() => setAdded(true)} />
    </Suspense>
  );
}

function Review({ decoded, onAdded }: { decoded: Promise<Decoded>; onAdded: () => void }) {
  const result = use(decoded);
  if ("error" in result) return <Message title="Couldn't read this link">{result.error}</Message>;

  const cards = Object.keys(result.data.progress).length;
  const symbols = Object.keys(result.data.zhuyinProgress).length;
  const stars = result.data.stars.length;

  const add = () => {
    applyTransfer(result.data);
    // Off the address bar, so a reload or bookmark doesn't add it again.
    history.replaceState(null, "", location.pathname);
    onAdded();
  };

  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>Add progress from another device?</h2>
      <ul className={styles.summary}>
        <li>
          {cards} {cards === 1 ? "card" : "cards"}
        </li>
        <li>
          {symbols} zhuyin {symbols === 1 ? "symbol" : "symbols"}
        </li>
        {stars > 0 && (
          <li>
            {stars} starred {stars === 1 ? "card" : "cards"}
          </li>
        )}
      </ul>
      <p className={styles.note}>
        Progress already on this device is kept: each card ends up at whichever is further along,
        and keeps its star.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={add}>
          Add progress
        </Button>
        <Link href="/" className={buttonClassName({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </Card>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p>{children}</p>
    </Card>
  );
}
