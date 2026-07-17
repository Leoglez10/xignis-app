import type { UserRole } from "../lib/database.types";

export type NavTab = { to: string; label: string; end?: boolean };

/**
 * Tabs del header por rol (sustituyen a los antiguos bottom nav). El header las
 * lee desde `useAuth()` + la ruta actual para marcar la activa y el título.
 */
const adminTabs: NavTab[] = [
  { to: "/admin", label: "Inicio", end: true },
  { to: "/admin/requests", label: "Solicitudes" },
  { to: "/admin/absences", label: "Ausentes" },
  { to: "/admin/employees", label: "Empleados" },
  { to: "/admin/departments", label: "Áreas" },
  { to: "/admin/reports", label: "Reportes" },
  { to: "/admin/rules", label: "Reglas" },
  { to: "/profile", label: "Perfil" },
];

export const tabsByRole: Record<UserRole, NavTab[]> = {
  employee: [
    { to: "/employee", label: "Inicio", end: true },
    { to: "/employee/requests", label: "Solicitudes" },
    { to: "/profile", label: "Perfil" },
  ],
  manager: [
    { to: "/manager", label: "Inicio", end: true },
    { to: "/manager/requests", label: "Solicitudes" },
    { to: "/manager/team", label: "Equipo" },
    { to: "/manager/calendar", label: "Agenda" },
    { to: "/profile", label: "Perfil" },
  ],
  hr_admin: adminTabs,
  admin: adminTabs,
};

/** Título grande del header según la tab activa para la ruta dada. */
export function titleForPath(role: UserRole, pathname: string): string {
  const tabs = tabsByRole[role];
  const match = tabs.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
  return match?.label ?? "Inicio";
}
