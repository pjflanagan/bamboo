import { describe, expect, it } from "vitest";
import { seededHues } from "./hue";

describe("seededHues", () => {
  it("is deterministic", () => {
    expect(seededHues("方昕中文")).toEqual(seededHues("方昕中文"));
  });

  it("keeps the text hue at least 80° from the border hue", () => {
    for (let i = 0; i < 1000; i++) {
      const { hue, textHue } = seededHues(`seed-${i}`);
      const distance = Math.min(Math.abs(hue - textHue), 360 - Math.abs(hue - textHue));
      expect(distance).toBeGreaterThanOrEqual(80);
    }
  });
});
