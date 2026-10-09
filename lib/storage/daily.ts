import { createLocalStore } from "./localStore";

/** Today in local time, as YYYY-MM-DD. */
export function today(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type DailyChecklist = { day: string; tasks: readonly string[] };

/**
 * The homepage's daily tasks: ids checked off today. A list from an earlier
 * day reads as empty, so the checklist starts fresh each morning.
 */
export const dailyTasksStore = createLocalStore<DailyChecklist>(
  "bamboo-daily-tasks",
  (raw) => {
    const value = raw as Partial<DailyChecklist> | null;
    return typeof value?.day === "string" && Array.isArray(value.tasks)
      ? { day: value.day, tasks: value.tasks.filter((t): t is string => typeof t === "string") }
      : { day: "", tasks: [] };
  },
  { day: "", tasks: [] },
);
