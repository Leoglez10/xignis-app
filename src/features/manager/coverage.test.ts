import { describe, expect, it } from "vitest";
import { monthCellsISO } from "../../lib/date";
import type { Profile } from "../../lib/database.types";
import type { LeaveRequestWithEmployee } from "../leave-requests/services/leaveRequestService";
import { absentByDate, coverageDay, coverageLevel, LOW_COVERAGE_THRESHOLD, mergeAbsences } from "./coverage";

const members = [
  { full_name: "Ana Pérez", id: "e1" },
  { full_name: "Luis Gil", id: "e2" },
  { full_name: "Marta Sol", id: "e3" },
] as Profile[];

function absence(id: string, employeeId: string, start: string, end: string) {
  return { employee_id: employeeId, end_date: end, id, leave_type: "vacation", start_date: start } as LeaveRequestWithEmployee;
}

describe("month grid for the coverage calendar", () => {
  it("starts on Monday and pads with muted days outside the month", () => {
    const cells = monthCellsISO(2026, 8); // septiembre 2026, empieza en martes
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ iso: "2026-08-31", isInMonth: false });
    expect(cells[1]).toEqual({ iso: "2026-09-01", isInMonth: true });
    expect(cells.filter((c) => c.isInMonth)).toHaveLength(30);
    expect(cells.at(-1)).toEqual({ iso: "2026-10-11", isInMonth: false });
  });
});

describe("coverage per day", () => {
  const byDate = absentByDate(members, [
    absence("r1", "e1", "2026-09-24", "2026-09-26"),
    absence("r2", "e2", "2026-09-26", "2026-09-26"),
    absence("r3", "e1", "2026-09-26", "2026-09-26"), // misma persona, no cuenta doble
  ]);

  it("is full when nobody is out", () => {
    const d = coverageDay("2026-09-23", 3, byDate);
    expect(d).toMatchObject({ absent: [], dayNum: 23, present: 3, weekday: "X" });
    expect(coverageLevel(d.ratio)).toBe("full");
  });

  it("is partial when some people are out but above the threshold", () => {
    const d = coverageDay("2026-09-25", 3, byDate);
    expect(d.present).toBe(2);
    expect(d.absent.map((a) => a.name)).toEqual(["Ana Pérez"]);
    expect(coverageLevel(d.ratio)).toBe("partial");
  });

  it("is low when coverage drops below the threshold", () => {
    const d = coverageDay("2026-09-26", 3, byDate);
    expect(d.present).toBe(1);
    expect(d.ratio).toBeLessThan(LOW_COVERAGE_THRESHOLD);
    expect(coverageLevel(d.ratio)).toBe("low");
  });

  it("merges absence sources without duplicating a request", () => {
    const a = absence("r1", "e1", "2026-09-24", "2026-09-26");
    expect(mergeAbsences([a], [a, absence("r9", "e2", "2026-09-01", "2026-09-01")]).map((x) => x.id)).toEqual(["r1", "r9"]);
  });
});
