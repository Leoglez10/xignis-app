import { describe, expect, it } from "vitest";
import { pickRange, previewRangeEnd } from "./DateRangeCalendar";
import { monthCellsISO } from "../../lib/date";

describe("pickRange", () => {
  const empty = { end: "", start: "" };

  it("primer tap fija el inicio", () => {
    expect(pickRange(empty, "2026-07-10")).toEqual({ end: "", start: "2026-07-10" });
  });

  it("segundo tap posterior fija el fin", () => {
    expect(pickRange({ end: "", start: "2026-07-10" }, "2026-07-14")).toEqual({ end: "2026-07-14", start: "2026-07-10" });
  });

  it("permite un rango de un solo día", () => {
    expect(pickRange({ end: "", start: "2026-07-10" }, "2026-07-10")).toEqual({ end: "2026-07-10", start: "2026-07-10" });
  });

  it("tocar antes del inicio reinicia la selección", () => {
    expect(pickRange({ end: "", start: "2026-07-10" }, "2026-07-08")).toEqual({ end: "", start: "2026-07-08" });
  });

  it("con el rango completo, un nuevo tap reinicia", () => {
    expect(pickRange({ end: "2026-07-14", start: "2026-07-10" }, "2026-07-20")).toEqual({ end: "", start: "2026-07-20" });
  });
});

describe("previewRangeEnd", () => {
  it("marca el día apuntado cuando sólo hay inicio", () => {
    expect(previewRangeEnd({ end: "", start: "2026-07-10" }, "2026-07-15")).toBe("2026-07-15");
  });

  it("no marca nada si el rango ya está completo", () => {
    expect(previewRangeEnd({ end: "2026-07-14", start: "2026-07-10" }, "2026-07-20")).toBe("");
  });

  it("no marca nada hacia atrás ni sin inicio ni sin hover", () => {
    expect(previewRangeEnd({ end: "", start: "2026-07-10" }, "2026-07-05")).toBe("");
    expect(previewRangeEnd({ end: "", start: "" }, "2026-07-05")).toBe("");
    expect(previewRangeEnd({ end: "", start: "2026-07-10" }, null)).toBe("");
  });
});

describe("monthCellsISO", () => {
  it("rinde 42 celdas empezando en lunes y marca el mes actual", () => {
    const cells = monthCellsISO(2026, 6); // julio 2026: inicia miércoles
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ iso: "2026-06-29", isInMonth: false });
    expect(cells.filter((cell) => cell.isInMonth)).toHaveLength(31);
  });
});
