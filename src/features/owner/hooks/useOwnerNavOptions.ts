import type { NavOptions } from "../../../app/navConfig";
import { useAuth } from "../../session/AuthContext";
import { useOwnerViewMode } from "../ownerViewMode";
import { useDirectReportsCount } from "./useHasDirectReports";

/**
 * Opciones de navegación del usuario actual: reportes directos del dueño y si
 * eligió la vista "solo equipo". Una sola fuente para TopBar, Sidebar,
 * PageTransition y las rutas, así todas siguen el mismo modo.
 */
export function useOwnerNavOptions(): NavOptions & { directReports: number } {
  const { profile } = useAuth();
  const isOwner = profile?.role === "owner";
  const directReports = useDirectReportsCount({ enabled: isOwner });
  const [mode] = useOwnerViewMode();
  const hasDirectReports = isOwner && directReports > 0;
  return { directReports, hasDirectReports, teamView: hasDirectReports && mode === "team" };
}
