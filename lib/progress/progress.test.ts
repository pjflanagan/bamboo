import { describe, expect, it } from "vitest";
import { clampProgress, parseProgress, pickNext, weightOf } from "./progress";

describe("clampProgress", () => {
  it("clamps to 0..1 and rounds away float drift", () => {
    expect(clampProgress(0.1 + 0.2)).toBe(0.3);
    expect(clampProgress(1.2)).toBe(1);
    expect(clampProgress(-0.1)).toBe(0);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe("parseProgress", () => {
  it("keeps numbers and drops everything else", () => {
    expect(parseProgress({ 你好: 0.5, 再見: "x", 謝謝: 3 })).toEqual({ 你好: 0.5, 謝謝: 1 });
    expect(parseProgress(null)).toEqual({});
  });
});

describe("pickNext", () => {
  it("weights new cards above known ones", () => {
    expect(weightOf(0)).toBeGreaterThan(weightOf(0.5));
    expect(weightOf(0.5)).toBeGreaterThan(weightOf(1));
    expect(weightOf(1)).toBeGreaterThan(0);
  });

  it("never repeats the current card", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.9999]) {
      expect(pickNext([0, 0, 0], 1, () => r)).not.toBe(1);
    }
  });

  it("returns the only card", () => {
    expect(pickNext([0.5], 0)).toBe(0);
  });

  it("picks lesser-known cards more often", () => {
    const counts = [0, 0];
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 2000; i++) counts[pickNext([0, 1], undefined, random)]++;
    expect(counts[0]).toBeGreaterThan(counts[1] * 10);
  });
});
