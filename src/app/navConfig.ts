import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarOff,
  CircleUser,
  Crown,
  Flag,
  Home,
  Inbox,
  MessageSquare,
  SlidersHorizontal,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../lib/database.types";
import { accountPath, isAccountPath } from "../features/account/accountSections";

/** Ítem "Cuenta > Perfil" de todos los roles: abre la página Cuenta en Perfil. */
export const ACCOUNT_PROFILE_PATH = accountPath("perfil");

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
  { to: "/admin/owner-requests", label: "Pedidos", icon: MessageSquare, group: "Principal" },
  { to: "/admin/hr-reports", label: "Reportes RH", icon: Flag, group: "Principal" },
  { to: "/admin/employees", label: "Empleados", icon: Users, group: "Organización" },
  { to: "/admin/departments", label: "Áreas", icon: Building2, group: "Organización" },
  { to: "/admin/reports", label: "Reportes", icon: BarChart3, group: "Análisis" },
  { to: "/admin/rules", label: "Reglas", icon: SlidersHorizontal, group: "Análisis" },
  { to: ACCOUNT_PROFILE_PATH, label: "Perfil", icon: CircleUser, group: "Cuenta" },
];

const ownerTabs: NavTab[] = [
  { to: "/owner", label: "Inicio", end: true, icon: Home, group: "Principal" },
  { to: "/owner/employees", label: "Empleados", icon: Users, group: "Principal" },
  { to: "/owner/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
  { to: "/owner/absences", label: "Ausentes", icon: CalendarOff, group: "Principal" },
  { to: "/owner/reports", label: "Reportes", icon: BarChart3, group: "Análisis" },
  { to: "/owner/rh-requests", label: "Pedidos a RH", icon: Crown, group: "Principal" },
  { to: ACCOUNT_PROFILE_PATH, label: "Perfil", icon: CircleUser, group: "Cuenta" },
];

export const tabsByRole: Record<UserRole, NavTab[]> = {
  owner: ownerTabs,
  employee: [
    { to: "/employee", label: "Inicio", end: true, icon: Home, group: "Principal" },
    { to: "/employee/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
    { to: ACCOUNT_PROFILE_PATH, label: "Perfil", icon: CircleUser, group: "Cuenta" },
  ],
  manager: [
    { to: "/manager", label: "Inicio", end: true, icon: Home, group: "Principal" },
    { to: "/manager/requests", label: "Solicitudes", icon: Inbox, group: "Principal" },
    { to: "/manager/team", label: "Equipo", icon: Users, group: "Equipo" },
    { to: "/manager/calendar", label: "Agenda", icon: CalendarDays, group: "Equipo" },
    { to: ACCOUNT_PROFILE_PATH, label: "Perfil", icon: CircleUser, group: "Cuenta" },
  ],
  hr_admin: adminTabs,
  admin: adminTabs,
};

export type NavOptions = {
  /** El usuario es jefe directo de alguien (`manager_id = yo`). */
  hasDirectReports?: boolean;
  /** Dueño con reportes directos en vista "solo equipo" (toggle de la TopBar). */
  teamView?: boolean;
};

/** Acceso del dueño a las solicitudes de su equipo directo. Reusa las
 *  pantallas de jefe: "jefe" es una relación, no un rol. */
export const ownerTeamTab: NavTab = {
  to: "/manager/requests",
  label: "Aprobaciones",
  icon: UserCheck,
  group: "Mi equipo",
};

/** Grupo "Mi equipo" del dueño con reportes directos: las mismas pantallas que
 *  ve un jefe (aprobaciones, equipo y agenda), dentro del shell del dueño. */
export const ownerTeamTabs: NavTab[] = [
  ownerTeamTab,
  { to: "/manager/team", label: "Equipo", icon: Users, group: "Mi equipo" },
  { to: "/manager/calendar", label: "Agenda", icon: CalendarDays, group: "Mi equipo" },
];

/** Vista "solo equipo" del dueño: inicio de equipo, las pantallas de jefe y
 *  Cuenta. Las páginas de toda la empresa quedan fuera. */
export const ownerTeamViewTabs: NavTab[] = [
  { to: "/manager", label: "Inicio", end: true, icon: Home, group: "Mi equipo" },
  ...ownerTeamTabs,
  ...ownerTabs.filter((t) => t.group === "Cuenta"),
];

/** Rutas de toda la empresa del dueño (ocultas en la vista "solo equipo"). */
export function isOwnerCompanyPath(pathname: string): boolean {
  return pathname === "/owner" || pathname.startsWith("/owner/");
}

/** Tabs del rol más las condicionales (p. ej. "Mi equipo" del dueño con reportes
 *  directos, entre "Principal" y "Análisis"). */
export function tabsFor(role: UserRole, options: NavOptions = {}): NavTab[] {
  const tabs = tabsByRole[role];
  if (role !== "owner" || !options.hasDirectReports) return tabs;
  if (options.teamView) return ownerTeamViewTabs;
  const analysisIndex = tabs.findIndex((t) => t.group === "Análisis");
  const at = analysisIndex === -1 ? tabs.length : analysisIndex;
  return [...tabs.slice(0, at), ...ownerTeamTabs, ...tabs.slice(at)];
}

/** Tabs agrupadas en el orden en que aparece cada grupo por primera vez. */
export function navGroups(role: UserRole, options: NavOptions = {}): { name: string; items: NavTab[] }[] {
  const groups: { name: string; items: NavTab[] }[] = [];
  for (const tab of tabsFor(role, options)) {
    const found = groups.find((g) => g.name === tab.group);
    if (found) found.items.push(tab);
    else groups.push({ name: tab.group, items: [tab] });
  }
  return groups;
}

/** Título grande del header según la tab activa para la ruta dada. */
export function titleForPath(role: UserRole, pathname: string, options: NavOptions = {}): string {
  // Todas las secciones de Cuenta (perfil, apariencia, ...) comparten título:
  // sin esto, las que no son tab caían en el "Inicio" por defecto.
  if (isAccountPath(pathname)) return "Cuenta";
  const tabs = tabsFor(role, options);
  const match = tabs.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
  return match?.label ?? "Inicio";
}
