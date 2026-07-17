import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getManagerApprovalSlaHours,
  listManagerLeaveRequests,
  listTeamUpcomingAbsences,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import type { Profile } from "../../../lib/database.types";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";
import { useAuth } from "../../session/AuthContext";

export type SlaInfo = { avgHours: number | null; count: number };

/**
 * Shared source for the manager pending-requests workload. Both the dashboard
 * ("Inicio", summary counts + top-3 preview) and the requests screen
 * ("Solicitudes", full queue) read from this hook so the data is fetched once
 * and cached under a single react-query key. Also wires the realtime
 * subscription that invalidates the cache on leave-request changes.
 */
export function useManagerPendingRequests() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const dashboardKey = useMemo(
    () => ["dashboard", "manager", profile?.id ?? "current"] as const,
    [profile?.id],
  );

  const dashboardQuery = useQuery({
    queryKey: dashboardKey,
    queryFn: async () => {
      const [pending, upcoming, members, sla] = await Promise.all([
        listManagerLeaveRequests(),
        listTeamUpcomingAbsences(),
        listMyTeam().catch(() => [] as Profile[]),
        getManagerApprovalSlaHours(30).catch(() => null),
      ]);
      return { absences: upcoming, pending, sla, team: members };
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToLeaveRequests({}, () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKey });
    });
    return unsubscribe;
  }, [dashboardKey, queryClient]);

  const { absences = [], pending = [], sla = null, team = [] } = dashboardQuery.data ?? {};
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  return {
    absences: absences as LeaveRequestWithEmployee[],
    error,
    isLoading: dashboardQuery.isLoading,
    pending: pending as LeaveRequestWithEmployee[],
    refetch: async () => {
      await dashboardQuery.refetch();
    },
    sla: sla as SlaInfo | null,
    team: team as Profile[],
  };
}
