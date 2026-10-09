import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDictionary } from "./dictionary";
import { splitPinyin, splitPinyinWord } from "./pinyin";
import { tokenize } from "./tokenize";
import type { PhraseData } from "@/design-system/hanzi/types";

const dictionary = parseDictionary(readFileSync("data/dictionary.csv", "utf-8"));

/** Compact view of a phrase: words joined by "|", readings in parentheses. */
function describePhrase(phrase: PhraseData): string {
  return phrase.words
    .map((word) =>
      word.tokens
        .map((t) => (t.kind === "text" ? t.text : `${t.syllable.trad}(${t.syllable.pinyin})`))
        .join(""),
    )
    .join(" | ");
}

describe("splitPinyinWord", () => {
  it("splits tone-marked syllables and keeps the marks", () => {
    expect(splitPinyinWord("chítáng")?.map((s) => s.pinyin)).toEqual(["chí", "táng"]);
  });

  it("reads tones from marks, numbers, or their absence", () => {
    expect(splitPinyinWord("mǎ")?.[0].tone).toBe(3);
    expect(splitPinyinWord("ma3")?.[0].tone).toBe(3);
    expect(splitPinyinWord("de")?.[0].tone).toBe(5);
  });

  it("handles ü written as ü, ǚ, or v", () => {
    expect(splitPinyinWord("lǜ")?.[0]).toMatchObject({ toneless: "lü", tone: 4, zhuyin: "ㄌㄩ" });
    expect(splitPinyinWord("nv3")?.[0]).toMatchObject({ toneless: "nü", tone: 3 });
  });

  it("respects apostrophes as syllable boundaries", () => {
    expect(splitPinyinWord("xī'ān")?.map((s) => s.toneless)).toEqual(["xi", "an"]);
    expect(splitPinyinWord("xiān")?.map((s) => s.toneless)).toEqual(["xian"]);
  });

  it("splits erhua into its own syllable", () => {
    expect(splitPinyinWord("nǎr")?.map((s) => s.zhuyin)).toEqual(["ㄋㄚ", "ㄦ"]);
  });

  it("rejects text that isn't pinyin", () => {
    expect(splitPinyinWord("hello")).toBeNull();
  });
});

describe("splitPinyin", () => {
  it("ignores capitalization and punctuation", () => {
    const words = splitPinyin("Nǐ hǎo, shìjiè!");
    expect(words.map((w) => w.map((s) => s.pinyin))).toEqual([["nǐ"], ["hǎo"], ["shì", "jiè"]]);
  });

  it("skips latin words that aren't pinyin", () => {
    const words = splitPinyin("zhè lǐ yǒu Wi-Fi ma");
    expect(words.map((w) => w.map((s) => s.pinyin))).toEqual([["zhè"], ["lǐ"], ["yǒu"], ["ma"]]);
  });

  it("reads a breve as the third tone", () => {
    expect(splitPinyin("dă")[0][0]).toMatchObject({ toneless: "da", tone: 3 });
  });
});

describe("tokenize", () => {
  it("groups words by the pinyin's spaces", () => {
    const phrase = tokenize("池塘邊的榕樹上", dictionary, {
      pinyin: "Chítáng biān de róngshù shàng",
    });
    expect(describePhrase(phrase)).toBe(
      "池(chí)塘(táng) | 邊(biān) | 的(de) | 榕(róng)樹(shù) | 上(shàng)",
    );
  });

  it("takes polyphone readings from context, not the dictionary", () => {
    const phrase = tokenize("知了", dictionary, { pinyin: "zhīliǎo" });
    expect(describePhrase(phrase)).toBe("知(zhī)了(liǎo)");
    expect(dictionary.get("了")?.pinyin).toBe("le");
  });

  it("derives zhuyin and tone from the context reading", () => {
    const [word] = tokenize("了", dictionary, { pinyin: "liǎo" }).words;
    expect(word.tokens[0]).toMatchObject({
      kind: "hanzi",
      syllable: { zhuyin: "ㄌㄧㄠ", tone: 3 },
    });
  });

  it("attaches closing punctuation to the word before it", () => {
    const phrase = tokenize("你好，世界！", dictionary, { pinyin: "nǐ hǎo, shìjiè!" });
    expect(describePhrase(phrase)).toBe("你(nǐ) | 好(hǎo)， | 世(shì)界(jiè)！");
  });

  it("attaches opening punctuation to the word after it", () => {
    const phrase = tokenize("他說「好」", dictionary, { pinyin: "tā shuō hǎo" });
    expect(describePhrase(phrase)).toBe("他(tā) | 說(shuō) | 「好(hǎo)」");
  });

  it("falls back to the dictionary, one word per character, when pinyin doesn't line up", () => {
    const phrase = tokenize("你好", dictionary, { pinyin: "nǐ" });
    expect(describePhrase(phrase)).toBe("你(nǐ) | 好(hǎo)");
  });

  it("converts simplified input to traditional and keeps both forms", () => {
    const [word] = tokenize("马", dictionary).words;
    expect(word.tokens[0]).toMatchObject({ syllable: { trad: "馬", simp: "马" } });
  });

  it("lines up around latin text that appears in both hanzi and pinyin", () => {
    const phrase = tokenize("這裡有wi-fi嗎", dictionary, { pinyin: "zhè lǐ yǒu Wi-Fi ma" });
    expect(describePhrase(phrase)).toBe("這(zhè) | 裡(lǐ) | 有(yǒu) | wi-fi | 嗎(ma)");
  });

  it("groups latin runs into a single text token", () => {
    const phrase = tokenize("去KTV", dictionary);
    expect(describePhrase(phrase)).toBe("去(qù) | KTV");
  });

  it("carries the phrase's english", () => {
    expect(tokenize("好", dictionary, { english: "good" }).english).toBe("good");
  });
});
