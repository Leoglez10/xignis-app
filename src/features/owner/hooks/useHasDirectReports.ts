import { useQuery } from "@tanstack/react-query";
import { countDirectReports } from "../../profiles/services/profileService";
import { useAuth } from "../../session/AuthContext";

/**
 * ¿El usuario actual es jefe directo de alguien (`profiles.manager_id = yo`)?
 * "Jefe" es una relación, no un rol: el dueño con reportes directos los revisa
 * como jefe. `enabled` permite no consultar para roles donde no aplica.
 */
export function useHasDirectReports({ enabled = true }: { enabled?: boolean } = {}): boolean {
  const { profile } = useAuth();
  const profileId = profile?.id;

  const query = useQuery({
    enabled: enabled && Boolean(profileId),
    queryFn: () => countDirectReports(profileId as string),
    queryKey: ["direct-reports", profileId ?? "current"],
    staleTime: 5 * 60 * 1000,
  });

  return (query.data ?? 0) > 0;
}
