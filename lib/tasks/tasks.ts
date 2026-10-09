/*
 * The homepage's daily tasks are grouped by what each group asks for:
 * every task in it (all), any one of them (one), or nothing (none: optional
 * extras that never count toward the day).
 */

export type Requirement = "all" | "one" | "none";

type Group = { require: Requirement; items: readonly { id: string }[] };

export type GroupStatus = {
  /** How many checks the group asks for, and how many of those are done. */
  required: number;
  satisfied: number;
  met: boolean;
};

export function groupStatus(group: Group, done: readonly string[]): GroupStatus {
  const checked = group.items.filter((item) => done.includes(item.id)).length;
  const required = group.require === "all" ? group.items.length : group.require === "one" ? 1 : 0;
  const satisfied = Math.min(checked, required);
  return { required, satisfied, met: satisfied >= required };
}

/** The day as a whole: the required checks summed over every group. */
export function dayStatus(groups: readonly Group[], done: readonly string[]): GroupStatus {
  let required = 0;
  let satisfied = 0;
  for (const group of groups) {
    const status = groupStatus(group, done);
    required += status.required;
    satisfied += status.satisfied;
  }
  return { required, satisfied, met: satisfied >= required };
}
