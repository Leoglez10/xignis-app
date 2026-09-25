import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listTeamAbsencesInRange } from "../../leave-requests/services/leaveRequestService";

/** Prefijo de cache; el realtime del dashboard de jefe lo invalida junto al resto. */
export const TEAM_ABSENCES_RANGE_KEY = ["dashboard", "manager", "absences-range"] as const;

/**
 * Ausencias aprobadas que solapan [startISO, endISO] (mismo servicio que la
 * Agenda), acotadas a `memberIds` para que el dueño solo vea a sus reportes
 * directos. Mantiene el mes anterior mientras carga el nuevo.
 */
export function useTeamAbsencesInRange(startISO: string, endISO: string, memberIds: string[]) {
  const query = useQuery({
    enabled: memberIds.length > 0,
    placeholderData: (prev) => prev,
    queryFn: () => listTeamAbsencesInRange(startISO, endISO),
    queryKey: [...TEAM_ABSENCES_RANGE_KEY, startISO, endISO],
  });
  const idsKey = memberIds.join(",");
  return useMemo(() => {
    const ids = new Set(idsKey.split(","));
    return (query.data ?? []).filter((a) => a.employee_id !== null && ids.has(a.employee_id));
  }, [query.data, idsKey]);
}
