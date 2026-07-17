import { describe, expect, it } from "vitest";
import { nextHidden } from "./useScrollDirection";

describe("nextHidden", () => {
  it("siempre visible cerca del tope", () => {
    expect(nextHidden(0, 10, true)).toBe(false);
  });
  it("esconde al bajar más que el umbral", () => {
    expect(nextHidden(100, 120, false)).toBe(true);
  });
  it("muestra al subir más que el umbral", () => {
    expect(nextHidden(200, 180, true)).toBe(false);
  });
  it("mantiene estado sin movimiento relevante", () => {
    expect(nextHidden(200, 203, true)).toBe(true);
    expect(nextHidden(200, 203, false)).toBe(false);
  });
});
