import { expect, test } from "vitest";
import { greetingFor, longDateEs } from "./greeting";

test("greetingFor por hora del día", () => {
  expect(greetingFor(new Date("2026-07-06T03:00:00"))).toBe("Buenas noches");
  expect(greetingFor(new Date("2026-07-06T09:00:00"))).toBe("Buenos días");
  expect(greetingFor(new Date("2026-07-06T15:00:00"))).toBe("Buenas tardes");
  expect(greetingFor(new Date("2026-07-06T21:00:00"))).toBe("Buenas noches");
});

test("longDateEs capitaliza", () => {
  const s = longDateEs(new Date("2026-07-08T12:00:00"));
  expect(s.charAt(0)).toBe(s.charAt(0).toUpperCase());
  expect(s).toMatch(/julio|jul/);
  expect(s).toMatch(/8/);
});
