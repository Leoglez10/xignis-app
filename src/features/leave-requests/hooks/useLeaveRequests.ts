import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../lib/queryClient";
import { subscribeToLeaveRequests } from "../services/leaveRequestProgressService";
import { listHrLeaveRequests, listManagerLeaveRequests, listMyLeaveRequests } from "../services/leaveRequestService";
import type { LeaveRequest } from "../../../lib/database.types";

type Scope = "hr" | "manager" | "mine";
const loaders = { hr: listHrLeaveRequests, manager: listManagerLeaveRequests, mine: listMyLeaveRequests };
export function useLeaveRequests(scope: Scope, userId?: string) {
  const client = useQueryClient();
  const queryKey = useMemo(() => queryKeys.leaveRequests(scope, userId), [scope, userId]);
  const query = useQuery<LeaveRequest[]>({ queryKey, queryFn: async () => (await loaders[scope]()) as LeaveRequest[] });
  useEffect(() => subscribeToLeaveRequests(scope === "mine" && userId ? { employeeId: userId } : {}, () => { void client.invalidateQueries({ queryKey }); }), [client, queryKey, scope, userId]);
  return query;
}
