import { expect, test } from "vitest";
import {
  DASHBOARD_PREFS_DEFAULTS,
  parsePrefs,
  type DashboardPrefs,
} from "./useDashboardPrefs";

test("parsePrefs: null/empty → defaults", () => {
  expect(parsePrefs(null)).toEqual(DASHBOARD_PREFS_DEFAULTS);
  expect(parsePrefs("")).toEqual(DASHBOARD_PREFS_DEFAULTS);
});

test("parsePrefs: JSON inválido → defaults", () => {
  expect(parsePrefs("{not json")).toEqual(DASHBOARD_PREFS_DEFAULTS);
});

test("parsePrefs: merge partial con defaults", () => {
  const raw = JSON.stringify({ showAgenda: false } satisfies Partial<DashboardPrefs>);
  const result = parsePrefs(raw);
  expect(result.showAgenda).toBe(false);
  expect(result.showTeamWidget).toBe(true);
  expect(result.agendaCollapsed).toBe(false);
});