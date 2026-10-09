import { describe, expect, it } from "vitest";
import { splitGlossary } from "./glossary";

describe("splitGlossary", () => {
  it("prefers the longest term", () => {
    expect(splitGlossary("Translate 唱歌", ["唱", "唱歌"])).toEqual([
      { text: "Translate " },
      { text: "唱歌", term: "唱歌" },
    ]);
  });

  it("finds several terms and leaves the rest as text", () => {
    expect(splitGlossary("你好, 我是", ["你好", "我是"])).toEqual([
      { text: "你好", term: "你好" },
      { text: ", " },
      { text: "我是", term: "我是" },
    ]);
  });

  it("returns plain text without terms", () => {
    expect(splitGlossary("hello", [])).toEqual([{ text: "hello" }]);
    expect(splitGlossary("hello", ["你"])).toEqual([{ text: "hello" }]);
  });
});
