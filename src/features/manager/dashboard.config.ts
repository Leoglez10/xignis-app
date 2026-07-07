import type { LeaveRequestWithEmployee } from "../leave-requests/services/leaveRequestService";

export const UPCOMING_WINDOW_DAYS = 7;

type DashboardStatsState = {
  absences: LeaveRequestWithEmployee[];
  pending: LeaveRequestWithEmployee[];
  teamCount: number;
  absentTodayCount: number;
  upcomingWeekCount: number;
};

export type StatConfigItem = {
  compute: (state: DashboardStatsState) => number;
  key: string;
  label: string;
  tone: string;
};

/** Stats data-driven: añadir/quitar tocando este array, no el JSX del dashboard. */
export const STATS_CONFIG: StatConfigItem[] = [
  {
    compute: (s) => s.pending.length,
    key: "pending",
    label: "Pendientes",
    tone: "bg-[var(--stat-pending)] text-[var(--stat-pending-text)]",
  },
  {
    compute: (s) => s.absentTodayCount,
    key: "absent-today",
    label: "Ausentes hoy",
    tone: "bg-[var(--stat-absent)] text-[var(--stat-absent-text)]",
  },
  {
    compute: (s) => s.upcomingWeekCount,
    key: "upcoming-7d",
    label: "Próximas (7d)",
    tone: "bg-[var(--stat-upcoming)] text-[var(--stat-upcoming-text)]",
  },
];