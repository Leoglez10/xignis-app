import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeaveRequest, LeaveRequestApproval } from "../../../lib/database.types";
import { employeeHasManager, listRequestApprovals, subscribeToLeaveRequest } from "../services/leaveRequestProgressService";
import { getLeaveRequest, getLeaveRequestWithEmployee } from "../services/leaveRequestService";

export type LiveLeaveRequest = { approvals: LeaveRequestApproval[]; error: string | null; hasManager: boolean; isLoading: boolean; request: LeaveRequest | null };

export function useLiveLeaveRequest(requestId: string | undefined, opts?: { withEmployee?: boolean }): LiveLeaveRequest {
  const queryClient = useQueryClient();
  const withEmployee = Boolean(opts?.withEmployee);
  const queryKey = useMemo(() => ["leave-request", requestId ?? "missing", withEmployee] as const, [requestId, withEmployee]);
  const query = useQuery({
    enabled: Boolean(requestId),
    queryKey,
    queryFn: async () => {
      const request = withEmployee ? await getLeaveRequestWithEmployee(requestId!) : await getLeaveRequest(requestId!);
      const [approvals, hasManager] = await Promise.all([
        listRequestApprovals(requestId!),
        request ? employeeHasManager(request.employee_id).catch(() => false) : false,
      ]);
      return { approvals, hasManager, request };
    },
  });

  useEffect(() => {
    if (!requestId) return;
    return subscribeToLeaveRequest(requestId, () => { void queryClient.invalidateQueries({ queryKey }); });
  }, [queryClient, requestId, queryKey]);

  return {
    approvals: query.data?.approvals ?? [],
    error: query.error instanceof Error ? query.error.message : query.error ? "No se pudo cargar la solicitud." : null,
    hasManager: query.data?.hasManager ?? false,
    isLoading: Boolean(requestId) && query.isLoading,
    request: (query.data?.request ?? null) as LeaveRequest | null,
  };
}
