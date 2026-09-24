import { expect, test } from "vitest";
import { INICIO_PREFS_DEFAULTS, parseInicioPrefs, type InicioPrefs } from "./useInicioPrefs";

test("parseInicioPrefs: null/empty → defaults", () => {
  expect(parseInicioPrefs(null)).toEqual(INICIO_PREFS_DEFAULTS);
  expect(parseInicioPrefs("")).toEqual(INICIO_PREFS_DEFAULTS);
});

test("parseInicioPrefs: JSON inválido → defaults", () => {
  expect(parseInicioPrefs("{not json")).toEqual(INICIO_PREFS_DEFAULTS);
});

test("parseInicioPrefs: merge partial con defaults", () => {
  const raw = JSON.stringify({ showCharts: false } satisfies Partial<InicioPrefs>);
  const result = parseInicioPrefs(raw);
  expect(result.showCharts).toBe(false);
  expect(result.showMovements).toBe(true);
  expect(result.showAbsentToday).toBe(true);
});
