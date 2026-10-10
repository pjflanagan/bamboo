"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AppLink } from "@/components/AppLink";
import { Glossed } from "@/components/Glossed";
import { Checkbox } from "@/design-system/controls";
import { CheckIcon } from "@/design-system/icons";
import { Sign } from "@/design-system/motifs";
import { useLocalStore } from "@/hooks";
import type { Glossary, HomeContent, Task } from "@/lib/data";
import { dailyTasksStore, today } from "@/lib/storage";
import { dayStatus } from "@/lib/tasks";
import styles from "../home.module.css";

function TaskLabel({ task, glossary }: { task: Task; glossary: Glossary }) {
  // Inside a checkbox label (and maybe a link): the tooltip isn't a tab stop.
  const label = <Glossed text={task.label} glossary={glossary} focusable={false} />;
  if (task.app) return <AppLink app={task.app}>{label}</AppLink>;
  if (task.href?.startsWith("/")) return <Link href={task.href}>{label}</Link>;
  if (task.href) return <a href={task.href}>{label}</a>;
  return label;
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
export function DailyTasks({
  tasks: { title, groups },
  glossary,
}: {
  tasks: HomeContent["tasks"];
  glossary: Glossary;
}) {
  const stored = useLocalStore(dailyTasksStore);
  const day = useToday();
  const done = day && stored.day === day ? stored.tasks : [];

  const toggle = (id: string, checked: boolean) =>
    dailyTasksStore.set({
      day: today(),
      tasks: checked ? [...done, id] : done.filter((task) => task !== id),
    });

  const overall = dayStatus(groups, done);

  return (
    <>
      <div className={styles.cardHeader}>
        <Sign as="h2" text={title} className={styles.cardTitle}>
          <Glossed text={title} glossary={glossary} />
        </Sign>
        <span className={styles.tally} data-met={overall.met || undefined}>
          {overall.met ? (
            <>
              <CheckIcon size={14} /> Done for today
            </>
          ) : (
            `${overall.satisfied} / ${overall.required} today`
          )}
        </span>
      </div>
      <div className={styles.taskColumns}>
        {groups.map((group) => (
          <div key={group.title} className={styles.taskGroup}>
            <Sign as="h3" variant="text" text={group.title} className={styles.groupTitle}>
              <Glossed text={group.title} glossary={glossary} />
            </Sign>
            <ul className={styles.checklist}>
              {group.items.map((task) => (
                <li key={task.id}>
                  <Checkbox
                    strike
                    checked={done.includes(task.id)}
                    onChange={(checked) => toggle(task.id, checked)}
                  >
                    <TaskLabel task={task} glossary={glossary} />
                  </Checkbox>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
