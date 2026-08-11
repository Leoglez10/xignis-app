import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarOff,
  CircleUser,
  Home,
  Inbox,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../lib/database.types";

export type NavTab = {
  to: string;
  label: string;
  end?: boolean;
  /** Icono de la sidebar de escritorio. Las tabs móviles lo ignoran. */
  icon: LucideIcon;
  /** Encabezado del grupo en la sidebar. Secciones nuevas solo eligen grupo. */
  group: string;
};

/**
 * Navegación por rol. En móvil son las tabs del header; en escritorio son los
 * ítems de la sidebar, agrupados por `group`. Una sola fuente para las dos, así
 * que el ORDEN importa: el swipe entre pestañas (PageTransition) usa el índice.
 */
const adminTabs: NavTab[] = [
  { to: "/admin", label: "Inicio", end: true, icon: Home, group: "Principal" },
  { to: "/admin/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
  { to: "/admin/absences", label: "Ausentes", icon: CalendarOff, group: "Principal" },
  { to: "/admin/employees", label: "Empleados", icon: Users, group: "Organización" },
  { to: "/admin/departments", label: "Áreas", icon: Building2, group: "Organización" },
  { to: "/admin/reports", label: "Reportes", icon: BarChart3, group: "Análisis" },
  { to: "/admin/rules", label: "Reglas", icon: SlidersHorizontal, group: "Análisis" },
  { to: "/profile", label: "Perfil", icon: CircleUser, group: "Cuenta" },
];

export const tabsByRole: Record<UserRole, NavTab[]> = {
  employee: [
    { to: "/employee", label: "Inicio", end: true, icon: Home, group: "Principal" },
    { to: "/employee/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
    { to: "/profile", label: "Perfil", icon: CircleUser, group: "Cuenta" },
  ],
  manager: [
    { to: "/manager", label: "Inicio", end: true, icon: Home, group: "Principal" },
    { to: "/manager/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
    { to: "/manager/team", label: "Equipo", icon: Users, group: "Equipo" },
    { to: "/manager/calendar", label: "Agenda", icon: CalendarDays, group: "Equipo" },
    { to: "/profile", label: "Perfil", icon: CircleUser, group: "Cuenta" },
  ],
  hr_admin: adminTabs,
  admin: adminTabs,
};

/** Tabs agrupadas en el orden en que aparece cada grupo por primera vez. */
export function navGroups(role: UserRole): { name: string; items: NavTab[] }[] {
  const groups: { name: string; items: NavTab[] }[] = [];
  for (const tab of tabsByRole[role]) {
    const found = groups.find((g) => g.name === tab.group);
    if (found) found.items.push(tab);
    else groups.push({ name: tab.group, items: [tab] });
  }
  return groups;
}

/** Título grande del header según la tab activa para la ruta dada. */
export function titleForPath(role: UserRole, pathname: string): string {
  const tabs = tabsByRole[role];
  const match = tabs.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
  return match?.label ?? "Inicio";
}
