import type { UserRole } from "../../lib/database.types";

/**
 * Las pantallas de jefe confían en RLS para acotar solicitudes al equipo. El
 * dueño ve toda la empresa (lectura), así que ahí se acota a sus reportes
 * directos (`manager_id = yo`). Para los demás roles no cambia nada.
 */
export function scopeToDirectReports<T extends { employee_id: string | null }>(
  rows: T[],
  role: UserRole | undefined,
  teamIds: Iterable<string>,
): T[] {
  if (role !== "owner") return rows;
  const ids = new Set(teamIds);
  return rows.filter((row) => row.employee_id !== null && ids.has(row.employee_id));
}
