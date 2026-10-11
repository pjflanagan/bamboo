/*
 * Everything a visitor has saved on this device, as one JSON file they can
 * download and load back, here or in another browser. Restoring replaces
 * each saved value with the file's; values the file leaves out are kept.
 */

import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  type Preferences,
} from "@/lib/preferences/preferences";
import { getPreferences, setPreferences } from "@/lib/preferences/store";
import { progressStore, zhuyinProgressStore } from "@/lib/progress/store";
import {
  chosenSetStore,
  dailyTasksStore,
  readerTextStore,
  today,
  type LocalStore,
} from "@/lib/storage";

const APP = "bamboo";
const VERSION = 1;

/** The localStorage values a backup carries, by their name in the file. */
const STORES = {
  progress: progressStore,
  zhuyinProgress: zhuyinProgressStore,
  chosenSet: chosenSetStore,
  readerText: readerTextStore,
  dailyTasks: dailyTasksStore,
} satisfies Record<string, LocalStore<unknown>>;

type Stores = typeof STORES;
type StoreName = keyof Stores;

export type BackupData = { preferences: Preferences } & {
  [K in StoreName]: ReturnType<Stores[K]["get"]>;
};

export type Backup = {
  app: typeof APP;
  version: number;
  exportedAt: string;
  data: BackupData;
};

/** A backup file that can't be read, with a message to show as is. */
export class BackupError extends Error {}

export function collectBackup(now = new Date()): Backup {
  const { theme, fonts, script } = getPreferences();
  const data = { preferences: { theme, fonts, script } } as BackupData;
  for (const name of Object.keys(STORES) as StoreName[]) {
    (data as Record<StoreName, unknown>)[name] = STORES[name].get();
  }
  return { app: APP, version: VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now = new Date()): string {
  return `bamboo-backup-${today(now)}.json`;
}

/**
 * Reads a backup file's text. Each value goes through the same checks as
 * reading it from storage; values the file doesn't have are left out.
 */
export function parseBackup(text: string): Partial<BackupData> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError("That file isn't a Bamboo backup (it isn't JSON).");
  }
  const file = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  if (file.app !== APP || typeof file.data !== "object" || file.data === null) {
    throw new BackupError("That file isn't a Bamboo backup.");
  }
  if (typeof file.version !== "number" || file.version > VERSION) {
    throw new BackupError("That backup is from a newer version of Bamboo.");
  }

  const source = file.data as Record<string, unknown>;
  const data: Partial<Record<keyof BackupData, unknown>> = {};
  if ("preferences" in source) data.preferences = normalizePreferences(source.preferences);
  for (const name of Object.keys(STORES) as StoreName[]) {
    if (name in source) data[name] = STORES[name].parse(source[name]);
  }
  return data as Partial<BackupData>;
}

/** Saves a parsed backup's values over the current ones. */
export function restoreBackup(data: Partial<BackupData>): void {
  if (data.preferences) setPreferences(data.preferences);
  for (const name of Object.keys(STORES) as StoreName[]) {
    if (name in data) (STORES[name] as LocalStore<unknown>).set(data[name]);
  }
}

/** Erases everything saved on this device, back to a first visit. */
export function clearAllData(): void {
  setPreferences(DEFAULT_PREFERENCES);
  for (const store of Object.values(STORES) as LocalStore<unknown>[]) {
    store.set(store.serverValue);
  }
}
