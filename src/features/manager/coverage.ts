import { eachDayIso, weekdayISO } from "../../lib/date";
import type { LeaveType, Profile } from "../../lib/database.types";
import type { LeaveRequestWithEmployee } from "../leave-requests/services/leaveRequestService";

/**
 * Cobertura diaria del equipo a partir de las ausencias aprobadas de los
 * reportes directos. Compartida por la tarjeta "Cobertura del equipo".
 */

export type AbsentEntry = { id: string; name: string; leaveType: LeaveType };
export type CoverageDay = {
  iso: string;
  weekday: string;
  dayNum: number;
  present: number;
  absent: AbsentEntry[];
  ratio: number;
};
export type CoverageLevel = "full" | "partial" | "low";

export const WEEKDAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"] as const;

/** Por debajo de este ratio de presentes la cobertura es baja (tono "Baja"/"Crítica"). */
export const LOW_COVERAGE_THRESHOLD = 0.6;

/** Fecha ISO → integrantes ausentes ese día (sin duplicar a la misma persona). */
export function absentByDate(members: Profile[], absences: LeaveRequestWithEmployee[]): Map<string, AbsentEntry[]> {
  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const map = new Map<string, AbsentEntry[]>();
  for (const a of absences) {
    if (!a.employee_id) continue;
    const name = nameById.get(a.employee_id) ?? a.employee?.full_name ?? "—";
    for (const iso of eachDayIso(a.start_date, a.end_date)) {
      const list = map.get(iso) ?? [];
      if (!list.some((e) => e.id === a.employee_id)) {
        list.push({ id: a.employee_id, name, leaveType: a.leave_type });
      }
      map.set(iso, list);
    }
  }
  return map;
}

export function coverageDay(iso: string, total: number, byDate: Map<string, AbsentEntry[]>): CoverageDay {
  const absent = byDate.get(iso) ?? [];
  const present = Math.max(0, total - absent.length);
  return {
    absent,
    dayNum: Number(iso.slice(8, 10)),
    iso,
    present,
    ratio: present / (total || 1),
    weekday: WEEKDAY_SHORT[weekdayISO(iso)],
  };
}

export function coverageLevel(ratio: number): CoverageLevel {
  if (ratio >= 1) return "full";
  if (ratio < LOW_COVERAGE_THRESHOLD) return "low";
  return "partial";
}

/** Une ausencias de varias fuentes sin repetir la misma solicitud. */
export function mergeAbsences(...lists: LeaveRequestWithEmployee[][]): LeaveRequestWithEmployee[] {
  const byId = new Map<string, LeaveRequestWithEmployee>();
  for (const list of lists) for (const a of list) byId.set(a.id, a);
  return [...byId.values()];
}
