import { describe, expect, it } from "vitest";
import { NO_AREA_COLOR, areaColor } from "./areaColor";

describe("areaColor", () => {
  it("returns the same color for the same department id", () => {
    const id = "8f2c1a44-0b6e-4d21-9b3a-77c0e1d5a912";
    expect(areaColor(id)).toBe(areaColor(id));
  });

  it("falls back to the neutral tone when there is no department", () => {
    expect(areaColor(null)).toBe(NO_AREA_COLOR);
    expect(areaColor(undefined)).toBe(NO_AREA_COLOR);
    expect(areaColor("")).toBe(NO_AREA_COLOR);
  });

  it("spreads ids across the palette instead of collapsing to one tone", () => {
    const ids = Array.from({ length: 24 }, (_, i) => `dept-${i}`);
    const tones = new Set(ids.map((id) => areaColor(id).bar));
    expect(tones.size).toBeGreaterThan(1);
  });

  it("prefers the explicitly picked color over the derived one", () => {
    const id = "8f2c1a44-0b6e-4d21-9b3a-77c0e1d5a912";
    expect(areaColor(id, "rose").key).toBe("rose");
    expect(areaColor(null, "rose").key).toBe("rose");
  });

  it("falls back to the derived color when the stored key is unknown", () => {
    const id = "8f2c1a44-0b6e-4d21-9b3a-77c0e1d5a912";
    expect(areaColor(id, "chartreuse")).toBe(areaColor(id));
  });
});
