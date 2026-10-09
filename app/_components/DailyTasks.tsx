"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AppLink } from "@/components/AppLink";
import { Checkbox } from "@/design-system/controls";
import { Sign } from "@/design-system/motifs";
import { useLocalStore } from "@/hooks";
import type { HomeContent, Task } from "@/lib/data";
import { dailyTasksStore, today } from "@/lib/storage";
import styles from "../home.module.css";

function TaskLabel({ task }: { task: Task }) {
  if (task.app) return <AppLink app={task.app}>{task.label}</AppLink>;
  if (task.href?.startsWith("/")) return <Link href={task.href}>{task.label}</Link>;
  if (task.href) return <a href={task.href}>{task.label}</a>;
  return task.label;
}

const noSubscribe = () => () => {};

/**
 * Today's date, read in the browser only: prerendering has no "today", and
 * the static page shows every task unchecked until hydration.
 */
function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, today, () => null);
}

/** The daily checklist. Checks are kept on this device and clear each day. */
export function DailyTasks({ groups }: { groups: HomeContent["tasks"]["groups"] }) {
  const stored = useLocalStore(dailyTasksStore);
  const day = useToday();
  const done = day && stored.day === day ? stored.tasks : [];

  const toggle = (id: string, checked: boolean) =>
    dailyTasksStore.set({
      day: today(),
      tasks: checked ? [...done, id] : done.filter((task) => task !== id),
    });

  return (
    <div className={styles.columns}>
      {groups.map((group) => (
        <div key={group.title}>
          <Sign as="h3" variant="text" className={styles.subheading}>
            {group.title}
          </Sign>
          <ul className={styles.checklist}>
            {group.items.map((task) => (
              <li key={task.id}>
                <Checkbox
                  strike
                  checked={done.includes(task.id)}
                  onChange={(checked) => toggle(task.id, checked)}
                >
                  <TaskLabel task={task} />
                </Checkbox>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
