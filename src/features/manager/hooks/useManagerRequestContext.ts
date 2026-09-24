import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { LeaveRequest } from "../../../lib/database.types";
import {
  getTimeBankFor,
  getVacationBalanceFor,
  listEmployeeLeaveRequests,
  listTeamAbsencesInRange,
  type LeaveRequestWithEmployee,
  type TimeBankBalance,
  type VacationBalance,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import { useAuth } from "../../session/AuthContext";
import { scopeToDirectReports } from "../teamScope";

export type ManagerRequestContext = {
  balance: VacationBalance | null;
  balanceError: boolean;
  history: LeaveRequest[];
  historyError: boolean;
  overlaps: LeaveRequestWithEmployee[];
  overlapsError: boolean;
  timeBank: TimeBankBalance | null;
  timeBankError: boolean;
};

/** Carga datos de contexto para que un jefe revise una solicitud. Cada consulta
 *  es independiente y no bloqueante: si una falla, las demás siguen disponibles
 *  y los botones de acción siempre se renderizan. */
export function useManagerRequestContext(
  employeeId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): ManagerRequestContext {
  const role = useAuth().profile?.role;
  const balanceQuery = useQuery({
    enabled: Boolean(employeeId),
    queryFn: async () => (employeeId ? getVacationBalanceFor(employeeId) : null),
    queryKey: ["manager", "vacation-balance", employeeId],
  });

  const timeBankQuery = useQuery({
    enabled: Boolean(employeeId),
    queryFn: async () => (employeeId ? getTimeBankFor(employeeId) : null),
    queryKey: ["manager", "time-bank", employeeId],
  });

  const historyQuery = useQuery({
    enabled: Boolean(employeeId),
    queryFn: async () => (employeeId ? listEmployeeLeaveRequests(employeeId) : []),
    queryKey: ["manager", "employee-requests", employeeId],
  });

  const overlapsQuery = useQuery({
    enabled: Boolean(startDate && endDate),
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const absences = await listTeamAbsencesInRange(startDate, endDate);
      if (role !== "owner") return absences;
      const team = await listMyTeam();
      return scopeToDirectReports(absences, role, team.map((m) => m.id));
    },
    queryKey: ["manager", "team-absences", role, startDate, endDate],
  });

  return useMemo(
    () => ({
      balance: balanceQuery.data ?? null,
      balanceError: !!balanceQuery.error,
      history: historyQuery.data ?? [],
      historyError: !!historyQuery.error,
      overlaps: overlapsQuery.data ?? [],
      overlapsError: !!overlapsQuery.error,
      timeBank: timeBankQuery.data ?? null,
      timeBankError: !!timeBankQuery.error,
    }),
    [balanceQuery, historyQuery, overlapsQuery, timeBankQuery],
  );
}
