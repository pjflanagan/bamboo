import { describe, expect, it } from "vitest";
import { dayStatus, groupStatus } from "./tasks";

const all = { require: "all" as const, items: [{ id: "a" }, { id: "b" }] };
const one = { require: "one" as const, items: [{ id: "c" }, { id: "d" }, { id: "e" }] };
const none = { require: "none" as const, items: [{ id: "f" }] };

describe("groupStatus", () => {
  it("all needs every task", () => {
    expect(groupStatus(all, ["a"])).toEqual({ required: 2, satisfied: 1, met: false });
    expect(groupStatus(all, ["a", "b"]).met).toBe(true);
  });

  it("one needs any single task, and more don't count extra", () => {
    expect(groupStatus(one, [])).toEqual({ required: 1, satisfied: 0, met: false });
    expect(groupStatus(one, ["c", "d"])).toEqual({ required: 1, satisfied: 1, met: true });
  });

  it("none is always met and never counts", () => {
    expect(groupStatus(none, ["f"])).toEqual({ required: 0, satisfied: 0, met: true });
  });
});

describe("dayStatus", () => {
  it("sums the required checks", () => {
    expect(dayStatus([all, one, none], ["a", "f"])).toEqual({
      required: 3,
      satisfied: 1,
      met: false,
    });
    expect(dayStatus([all, one, none], ["a", "b", "e"]).met).toBe(true);
  });
});
