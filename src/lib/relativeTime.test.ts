import { expect, test } from "vitest";
import { relativeTimeEs } from "./relativeTime";

const now = new Date("2026-07-06T12:00:00Z");

test("relativeTimeEs: pasado y futuro en español", () => {
  expect(relativeTimeEs(new Date("2026-07-06T10:00:00Z"), now)).toBe("hace 2 horas");
  expect(relativeTimeEs(new Date("2026-07-06T12:00:00Z"), now)).toBe("ahora");
  expect(relativeTimeEs(new Date("2026-07-04T12:00:00Z"), now)).toBe("anteayer");
  expect(relativeTimeEs(new Date("2026-07-06T12:05:00Z"), now)).toBe("dentro de 5 minutos");
});
