import { describe, expect, it } from "vitest";
import type { PhraseData } from "@/design-system/hanzi/types";
import { phraseMatches } from "./search";

const tomato: PhraseData = {
  english: "tomato",
  words: [
    {
      english: "foreign eggplant",
      tokens: [
        { kind: "hanzi", syllable: { trad: "番", simp: "番", pinyin: "fān" } },
        { kind: "hanzi", syllable: { trad: "茄", simp: "茄", pinyin: "qié" } },
      ],
    },
  ],
};

const book: PhraseData = {
  words: [
    {
      english: "book",
      tokens: [{ kind: "hanzi", syllable: { trad: "書", simp: "书", pinyin: "shū" } }],
    },
  ],
};

describe("phraseMatches", () => {
  it("finds everything for an empty search", () => {
    expect(phraseMatches(tomato, "")).toBe(true);
    expect(phraseMatches(tomato, "  ")).toBe(true);
  });

  it("matches hanzi in either script", () => {
    expect(phraseMatches(tomato, "茄")).toBe(true);
    expect(phraseMatches(book, "書")).toBe(true);
    expect(phraseMatches(book, "书")).toBe(true);
    expect(phraseMatches(book, "茄")).toBe(false);
  });

  it("matches pinyin with or without tones and spaces", () => {
    for (const query of ["fanqie", "fan qie", "fān qié", "FANQ", "qie"]) {
      expect(phraseMatches(tomato, query)).toBe(true);
    }
    expect(phraseMatches(tomato, "shu")).toBe(false);
  });

  it("matches the phrase's or a word's English, ignoring case", () => {
    expect(phraseMatches(tomato, "Tomat")).toBe(true);
    expect(phraseMatches(tomato, "eggplant")).toBe(true);
    expect(phraseMatches(book, "book")).toBe(true);
    expect(phraseMatches(book, "tomato")).toBe(false);
  });
});
