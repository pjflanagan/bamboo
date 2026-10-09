import { describe, expect, it } from "vitest";
import { compactDictionary, expandDictionary, parseDictionary } from "./dictionary";

const CSV = `hanzi,trad,simp,pinyin,toneless,tone,zhuyin
了,了,了,le,le,5,ㄌㄜ
們,們,们,men,men,5,ㄇㄣ
们,們,们,men,men,5,ㄇㄣ
好,好,好,hǎo,hao,3,ㄏㄠ`;

describe("compactDictionary", () => {
  it("round-trips through JSON", () => {
    const dictionary = parseDictionary(CSV);
    const json = JSON.parse(JSON.stringify(compactDictionary(dictionary)));
    expect(expandDictionary(json)).toEqual(dictionary);
  });

  it("keeps simplified keys pointing at the traditional form", () => {
    const expanded = expandDictionary(compactDictionary(parseDictionary(CSV)));
    expect(expanded.get("们")).toMatchObject({ trad: "們", simp: "们", tone: 5 });
  });
});
