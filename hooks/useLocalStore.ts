"use client";

import { useSyncExternalStore } from "react";
import type { LocalStore } from "@/lib/storage";

/**
 * A localStorage-backed value. Prerendering and hydration see the store's
 * server value; the saved value follows right after hydration.
 */
export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.serverValue);
}
