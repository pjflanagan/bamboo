/*
 * A value kept in localStorage, shaped for useSyncExternalStore: a cached
 * snapshot (stable between changes), a server snapshot for prerendering, and
 * subscribe, which also follows writes from other tabs.
 *
 * Storage can be unavailable (private windows, blocked site data). Reads then
 * return the fallback and writes only live in memory for this page.
 */

export type LocalStore<T> = {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
  /** What prerendering and the first hydration render see. */
  readonly serverValue: T;
  /** Validates an untrusted value (from storage or a backup file). */
  readonly parse: (raw: unknown) => T;
};

export function createLocalStore<T>(
  key: string,
  parse: (raw: unknown) => T,
  fallback: T,
): LocalStore<T> {
  let cached: { value: T } | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : parse(JSON.parse(raw));
    } catch {
      return fallback;
    }
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key) return;
    cached = null;
    notify();
  }

  return {
    serverValue: fallback,
    parse,
    get() {
      cached ??= { value: read() };
      return cached.value;
    },
    set(value) {
      cached = { value };
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // storage unavailable: keep the value in memory only
      }
      notify();
    },
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}
