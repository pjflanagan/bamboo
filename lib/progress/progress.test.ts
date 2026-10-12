import { describe, expect, it } from "vitest";
import {
  clampProgress,
  parseProgress,
  parseStars,
  pickNext,
  pickWeighted,
  syllableProgress,
  weightOf,
  zhuyinSymbols,
} from "./progress";

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

describe("stars", () => {
  it("keeps strings, each once, and drops everything else", () => {
    expect(parseStars(["你好", 3, "你好", null, "謝謝"])).toEqual(["你好", "謝謝"]);
    expect(parseStars({ 你好: true })).toEqual([]);
  });

  it("weighs a starred card more, at any progress", () => {
    for (const p of [0, 0.5, 1]) expect(weightOf(p, true)).toBeGreaterThan(weightOf(p));
    expect(weightOf(0)).toBeGreaterThan(weightOf(1, true));
  });

  it("picks a starred card more often than its unstarred equal", () => {
    const counts = [0, 0];
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const weights = [weightOf(0.5, true), weightOf(0.5)];
    for (let i = 0; i < 2000; i++) counts[pickWeighted(weights, undefined, random)]++;
    expect(counts[0]).toBeGreaterThan(counts[1] * 2);
  });
});

describe("zhuyin progress", () => {
  it("splits a syllable into its symbols, once each", () => {
    expect(zhuyinSymbols("ㄌㄧㄠ")).toEqual(["ㄌ", "ㄧ", "ㄠ"]);
    expect(zhuyinSymbols("ㄨㄨ")).toEqual(["ㄨ"]);
  });

  it("averages a syllable's symbols, unseen ones counting as 0", () => {
    expect(syllableProgress("ㄇㄚ", { ㄇ: 1, ㄚ: 0.5 })).toBe(0.75);
    expect(syllableProgress("ㄇㄚ", { ㄇ: 1 })).toBe(0.5);
    expect(syllableProgress("", {})).toBe(0);
  });
});
