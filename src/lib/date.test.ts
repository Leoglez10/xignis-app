import { expect, test } from "vitest";
import {
  daysFromToday,
  diffDaysInclusive,
  eachDayIso,
  formatDateRangeEs,
  formatDateEs,
  overlapsToday,
  startsWithinDays,
  todayIso,
} from "./date";

const NOW = new Date("2026-07-06T12:00:00Z");

test("formatDateEs / formatDateRangeEs", () => {
  expect(formatDateEs("2026-07-10")).toBe("10 jul");
  expect(formatDateRangeEs("2026-07-10", "2026-07-10")).toBe("10 jul");
  expect(formatDateRangeEs("2026-07-10", "2026-07-12")).toBe("10 jul – 12 jul");
});

test("todayIso, overlapsToday, startsWithinDays", () => {
  expect(todayIso(NOW)).toBe("2026-07-06");
  expect(overlapsToday("2026-07-01", "2026-07-10", NOW)).toBe(true);
  expect(overlapsToday("2026-07-10", "2026-07-15", NOW)).toBe(false);
  expect(startsWithinDays("2026-07-08", 7, NOW)).toBe(true);
  expect(startsWithinDays("2026-07-20", 7, NOW)).toBe(false);
});

test("eachDayIso (string arithmetic, no Date)", () => {
  expect(eachDayIso("2026-07-10", "2026-07-10")).toEqual(["2026-07-10"]);
  expect(eachDayIso("2026-07-10", "2026-07-12")).toEqual([
    "2026-07-10",
    "2026-07-11",
    "2026-07-12",
  ]);
  expect(eachDayIso("2026-01-30", "2026-02-02")).toEqual([
    "2026-01-30",
    "2026-01-31",
    "2026-02-01",
    "2026-02-02",
  ]);
  expect(eachDayIso("2024-02-28", "2024-03-01")).toEqual([
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
  ]);
});

test("diffDaysInclusive", () => {
  expect(diffDaysInclusive("2026-07-10", "2026-07-10")).toBe(1);
  expect(diffDaysInclusive("2026-07-10", "2026-07-12")).toBe(3);
  expect(diffDaysInclusive("2026-07-12", "2026-07-10")).toBe(0);
  expect(diffDaysInclusive("2026-02-28", "2026-03-01")).toBe(2);
});

test("daysFromToday", () => {
  const NOW = new Date("2026-07-06T12:00:00Z");
  expect(daysFromToday("2026-07-06", NOW)).toBe(0);
  expect(daysFromToday("2026-07-10", NOW)).toBe(4);
  expect(daysFromToday("2026-07-01", NOW)).toBe(-5);
});