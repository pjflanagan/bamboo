import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_COOKIE,
  parsePreferences,
  serializePreferencesCookie,
} from "./preferences";

describe("parsePreferences", () => {
  it("returns defaults for a missing or malformed cookie", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("%7Bnot json")).toEqual(DEFAULT_PREFERENCES);
  });

  it("keeps valid values and drops unknown ones", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ theme: "neon", font: "comic-sans", pinyin: "hover", zhuyin: "click" }),
    );
    expect(parsePreferences(raw)).toEqual({
      ...DEFAULT_PREFERENCES,
      theme: "neon",
      pinyin: "hover",
    });
  });

  it("round-trips through the cookie format", () => {
    const prefs = { ...DEFAULT_PREFERENCES, script: "simp", zhuyin: "collapsed" } as const;
    const cookie = serializePreferencesCookie(prefs);
    const value = cookie.split(";")[0].slice(PREFERENCES_COOKIE.length + 1);
    expect(parsePreferences(value)).toEqual(prefs);
  });
});
