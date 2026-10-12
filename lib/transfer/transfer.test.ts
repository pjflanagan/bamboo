import { describe, expect, it } from "vitest";
import {
  TransferError,
  decodeTransfer,
  encodeTransfer,
  mergeProgress,
  mergeStars,
  transferFragment,
} from "./transfer";

describe("transfer links", () => {
  it("round-trips progress and stars, leaving out zeros", async () => {
    const fragment = await encodeTransfer({
      progress: { 你好: 0.5, 再見: 0, 謝謝: 1 },
      zhuyinProgress: { ㄇ: 0.3 },
      stars: ["再見", "謝謝"],
    });
    expect(fragment).toMatch(/^v1\.[\w-]+$/);
    expect(await decodeTransfer(`#${fragment}`)).toEqual({
      progress: { 你好: 0.5, 謝謝: 1 },
      zhuyinProgress: { ㄇ: 0.3 },
      stars: ["再見", "謝謝"],
    });
  });

  it("reads a link made before stars as having none", async () => {
    // deflate-raw of {"p":{"a":0.5},"z":{}}
    const fragment = "v1.q1YqULKqVkpUsjLQM63VUapSsqqurQUA";
    expect(await decodeTransfer(fragment)).toEqual({
      progress: { a: 0.5 },
      zhuyinProgress: {},
      stars: [],
    });
  });

  it("stays short enough to share for a large history", async () => {
    const progress = Object.fromEntries(
      Array.from({ length: 2000 }, (_, i) => [`詞${i}`, (i % 10) / 10 + 0.1]),
    );
    const stars = Object.keys(progress).filter((_, i) => i % 5 === 0);
    const fragment = await encodeTransfer({ progress, zhuyinProgress: {}, stars });
    expect(fragment.length).toBeLessThan(20_000);
    expect((await decodeTransfer(fragment)).progress).toEqual(
      Object.fromEntries(Object.entries(progress).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    );
  });

  it("rejects links without progress or with damaged data", async () => {
    await expect(decodeTransfer("")).rejects.toThrow(TransferError);
    await expect(decodeTransfer("#v2.abc")).rejects.toThrow(TransferError);
    await expect(decodeTransfer("#v1.not-deflate")).rejects.toThrow(/damaged/);
  });

  it("cleans values like a storage read", async () => {
    const fragment = await encodeTransfer({
      progress: { 你好: 3 } as Record<string, number>,
      zhuyinProgress: {},
      stars: [],
    });
    expect((await decodeTransfer(fragment)).progress).toEqual({ 你好: 1 });
  });
});

describe("transferFragment", () => {
  it("reads a code, a whole link, or a code wrapped across lines", () => {
    expect(transferFragment("  v1.abc-_ \n")).toBe("v1.abc-_");
    expect(transferFragment("https://bamboo.flanny.app/transfer#v1.abc")).toBe("v1.abc");
    expect(transferFragment("v1.ab\ncd\r\n ef")).toBe("v1.abcdef");
  });
});

describe("mergeProgress", () => {
  it("keeps the higher value and every item from both", () => {
    expect(mergeProgress({ a: 0.8, b: 0.2 }, { b: 0.6, c: 0.4 })).toEqual({
      a: 0.8,
      b: 0.6,
      c: 0.4,
    });
  });
});

describe("mergeStars", () => {
  it("keeps every star from both, once each", () => {
    expect(mergeStars(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});
