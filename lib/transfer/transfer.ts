/*
 * Moving study progress to another device as a link. The progress rides in
 * the URL's #fragment, which browsers never send to a server: the link is
 * the only copy. Only progress travels (cards and zhuyin symbols), not
 * preferences or what's in the reader, and it merges into what's there:
 * each item keeps whichever value is higher, so nothing goes backward.
 *
 *   /transfer#v1.<base64url of deflated JSON {p: cards, z: zhuyin symbols}>
 */

import { parseProgress, type ProgressMap } from "@/lib/progress/progress";
import { progressStore, zhuyinProgressStore } from "@/lib/progress/store";

export const TRANSFER_PATH = "/transfer";
const PREFIX = "v1.";

export type TransferData = { progress: ProgressMap; zhuyinProgress: ProgressMap };

/** A link that can't be read, with a message to show as is. */
export class TransferError extends Error {}

/** 0 reads the same as never seen, so it's left out of the link. */
function withoutZeros(map: ProgressMap): ProgressMap {
  return Object.fromEntries(Object.entries(map).filter(([, value]) => value > 0));
}

async function pipe(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const piped = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  // In chunks: spreading a large array into fromCharCode overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** The fragment (without "#") carrying `data`. */
export async function encodeTransfer(data: TransferData): Promise<string> {
  const json = JSON.stringify({
    p: withoutZeros(data.progress),
    z: withoutZeros(data.zhuyinProgress),
  });
  const compressed = await pipe(
    new TextEncoder().encode(json),
    new CompressionStream("deflate-raw"),
  );
  return PREFIX + toBase64Url(compressed);
}

/** Reads a link's fragment ("#" optional), checking every value like storage reads. */
export async function decodeTransfer(fragment: string): Promise<TransferData> {
  const payload = fragment.replace(/^#/, "");
  if (!payload.startsWith(PREFIX)) {
    throw new TransferError("This link doesn't hold any progress. Try copying it again.");
  }
  let raw: unknown;
  try {
    const bytes = await pipe(
      fromBase64Url(payload.slice(PREFIX.length)),
      new DecompressionStream("deflate-raw"),
    );
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new TransferError("This link is incomplete or damaged. Try copying it again.");
  }
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return { progress: parseProgress(data.p), zhuyinProgress: parseProgress(data.z) };
}

/** Both maps' items, each at whichever value is higher. */
export function mergeProgress(current: ProgressMap, incoming: ProgressMap): ProgressMap {
  const merged: Record<string, number> = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }
  return merged;
}

export function collectTransfer(): TransferData {
  return { progress: progressStore.get(), zhuyinProgress: zhuyinProgressStore.get() };
}

/** Merges a decoded link's progress into this device's. */
export function applyTransfer(data: TransferData): void {
  progressStore.set(mergeProgress(progressStore.get(), data.progress));
  zhuyinProgressStore.set(mergeProgress(zhuyinProgressStore.get(), data.zhuyinProgress));
}
