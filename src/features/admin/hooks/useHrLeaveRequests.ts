import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listHrLeaveRequests,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";

/**
 * Shared source for the HR/admin leave-requests workload. Both the dashboard
 * ("Inicio", pending count + top-3 preview) and the requests screen
 * ("Solicitudes", full queue) read from this hook so the list is fetched once
 * and cached under a single react-query key, separate from the heavier
 * analytics query. Also wires the realtime subscription that invalidates the
 * cache on leave-request changes.
 */
export function useHrLeaveRequests() {
  const queryClient = useQueryClient();

  const requestsKey = ["leave-requests", "hr"] as const;

  const requestsQuery = useQuery({
    queryKey: requestsKey,
    queryFn: () => listHrLeaveRequests(),
  });

  useEffect(() => {
    const unsubscribe = subscribeToLeaveRequests({}, () => {
      void queryClient.invalidateQueries({ queryKey: requestsKey });
    });
    return unsubscribe;
  }, [queryClient]);

  const requests = (requestsQuery.data ?? []) as LeaveRequestWithEmployee[];
  const error = requestsQuery.error instanceof Error ? requestsQuery.error.message : null;

  return {
    error,
    isLoading: requestsQuery.isLoading,
    refetch: async () => {
      await requestsQuery.refetch();
    },
    requests,
  };
}
