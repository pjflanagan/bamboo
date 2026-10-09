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

  it("defaults each theme to its own font", () => {
    expect(DEFAULT_PREFERENCES.fonts).toEqual({ bamboo: "wenkai", neon: "sans" });
  });

  it("keeps valid values and drops unknown ones", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ theme: "neon", script: "cursive", fonts: { neon: "serif", bamboo: "x" } }),
    );
    expect(parsePreferences(raw)).toEqual({
      ...DEFAULT_PREFERENCES,
      theme: "neon",
      fonts: { neon: "serif", bamboo: "wenkai" },
    });
  });

  it("round-trips through the cookie format", () => {
    const prefs = {
      ...DEFAULT_PREFERENCES,
      script: "simp",
      fonts: { neon: "iansui", bamboo: "serif" },
    } as const;
    const cookie = serializePreferencesCookie(prefs);
    const value = cookie.split(";")[0].slice(PREFERENCES_COOKIE.length + 1);
    expect(parsePreferences(value)).toEqual(prefs);
  });
});
