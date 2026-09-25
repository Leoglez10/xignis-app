import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listManagerLeaveRequests,
  listTeamUpcomingAbsences,
  reviewLeaveRequest,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import type { Profile } from "../../../lib/database.types";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";
import { useAuth } from "../../session/AuthContext";
import { scopeToDirectReports } from "../teamScope";
import { TEAM_ABSENCES_RANGE_KEY } from "./useTeamAbsencesInRange";

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
      const [pending, upcoming, members] = await Promise.all([
        listManagerLeaveRequests(),
        listTeamUpcomingAbsences(),
        listMyTeam().catch(() => [] as Profile[]),
      ]);
      const teamIds = members.map((m) => m.id);
      return {
        absences: scopeToDirectReports(upcoming, profile?.role, teamIds),
        pending: scopeToDirectReports(pending, profile?.role, teamIds),
        team: members,
      };
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToLeaveRequests({}, () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKey });
      void queryClient.invalidateQueries({ queryKey: TEAM_ABSENCES_RANGE_KEY });
    });
    return unsubscribe;
  }, [dashboardKey, queryClient]);

  const { absences = [], pending = [], team = [] } = dashboardQuery.data ?? {};
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  // Inline approve/reject from the dashboard. Invalidates the shared cache so
  // the count shortcuts, urgent list and coverage all refresh at once.
  const reviewMutation = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected"; comment?: string }) =>
      reviewLeaveRequest({ ...input, reviewerRole: "manager" }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: dashboardKey }),
        queryClient.invalidateQueries({ queryKey: TEAM_ABSENCES_RANGE_KEY }),
      ]),
  });

  return {
    absences: absences as LeaveRequestWithEmployee[],
    error,
    isLoading: dashboardQuery.isLoading,
    pending: pending as LeaveRequestWithEmployee[],
    refetch: async () => {
      await dashboardQuery.refetch();
    },
    reviewRequest: reviewMutation.mutateAsync,
    team: team as Profile[],
  };
}
