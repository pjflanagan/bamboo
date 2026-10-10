import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/preferences/preferences";
import { BackupError, backupFileName, parseBackup, type BackupData } from "./backup";

const file = (data: unknown, extra: object = {}) =>
  JSON.stringify({ app: "bamboo", version: 1, exportedAt: "", data, ...extra });

describe("parseBackup", () => {
  it("round-trips every value", () => {
    const data: BackupData = {
      preferences: { ...DEFAULT_PREFERENCES, theme: "neon" },
      progress: { 你好: 0.5 },
      zhuyinProgress: { ㄇ: 0.3 },
      chosenSet: "class-verbs-1",
      readerText: "我喜歡讀書",
      dailyTasks: { day: "2026-10-10", tasks: ["flashcards"] },
    };
    expect(parseBackup(file(data))).toEqual(data);
  });

  it("keeps only the values the file has, cleaned like stored ones", () => {
    expect(parseBackup(file({ progress: { 你好: 0.5, 再見: "x", 謝謝: 3 } }))).toEqual({
      progress: { 你好: 0.5, 謝謝: 1 },
    });
  });

  it("fills unknown preferences with defaults", () => {
    const { preferences } = parseBackup(file({ preferences: { theme: "neon", script: "??" } }));
    expect(preferences?.theme).toBe("neon");
    expect(preferences?.script).toBe("trad");
  });

  it("rejects files that aren't backups", () => {
    expect(() => parseBackup("not json")).toThrow(BackupError);
    expect(() => parseBackup("{}")).toThrow(BackupError);
    expect(() => parseBackup(file({}, { app: "other" }))).toThrow(BackupError);
    expect(() => parseBackup(file({}, { version: 99 }))).toThrow(/newer/);
  });
});

describe("backupFileName", () => {
  it("dates the file", () => {
    expect(backupFileName(new Date(2026, 9, 10))).toBe("bamboo-backup-2026-10-10.json");
  });
});
