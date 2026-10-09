import { describe, expect, it } from "vitest";
import { parseInlineLinks } from "./links";

describe("parseInlineLinks", () => {
  it("splits text and links", () => {
    expect(
      parseInlineLinks("See the [chart](/zhuyin-chart) or [docs](https://x.y/a?b=c)."),
    ).toEqual([
      { text: "See the " },
      { text: "chart", href: "/zhuyin-chart" },
      { text: " or " },
      { text: "docs", href: "https://x.y/a?b=c" },
      { text: "." },
    ]);
  });

  it("leaves text without links alone", () => {
    expect(parseInlineLinks("你好 [not a link]")).toEqual([{ text: "你好 [not a link]" }]);
    expect(parseInlineLinks("")).toEqual([]);
  });
});
