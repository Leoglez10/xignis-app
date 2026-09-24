import { UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminShell } from "../components/adminNav";
import { Button } from "../../../components/ui/Button";
import { BirthdayHero } from "../../../components/BirthdayHero";
import { BirthdayStrip } from "../../../components/BirthdayStrip";
import { CustomizeInicioSheet } from "../components/CustomizeInicioSheet";
import { FocusBlock } from "../components/FocusBlock";
import { StaffMovementsCard } from "../components/StaffMovementsCard";
import { TrendChart } from "../components/TrendChart";
import { TypeDistributionChart } from "../components/TypeDistributionChart";
import { usePreferences } from "../../settings/PreferencesContext";
import { listEmployees } from "../../profiles/services/profileService";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";
import { useAuth } from "../../session/AuthContext";
import { useHrLeaveRequests } from "../hooks/useHrLeaveRequests";
import { useInicioPrefs } from "../hooks/useInicioPrefs";
import {
  getAdminDashboardStats,
  getInactiveEmployees,
  getLeaveTypeDistribution,
  getMonthlyTrend,
  getRecentOnboardings,
  getRecentTerminations,
  type InactiveEmployee,
  type MonthlyTrend,
  type RecentOnboarding,
  type RecentTermination,
  type TypeDistribution,
} from "../services/dashboardService";

function isPending(status: LeaveRequestWithEmployee["status"]): boolean {
  return status === "pending_hr" || status === "approved_by_manager";
}

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { prefs, update } = useInicioPrefs();
  const [isCustomizeOpen, setCustomizeOpen] = useState(false);

  // Leave-requests list comes from the shared hook (also used by the
  // "Solicitudes" screen) so the summary preview stays light and the list is
  // fetched once. The heavy analytics live in the query below.
  const { isLoading: isRequestsLoading, requests } = useHrLeaveRequests();
  const { preferences } = usePreferences();

  // Org birthdays for the strip — only fetched when the preference is on.
  const birthdaysQuery = useQuery({
    enabled: preferences.birthdayVisibility,
    queryKey: ["dashboard", "admin", "birthdays"],
    queryFn: () => listEmployees().catch(() => []),
  });
  const birthdayMembers = birthdaysQuery.data ?? [];

  const dashboardKey = ["dashboard", "admin"] as const;
  const dashboardQuery = useQuery({
    queryKey: dashboardKey,
    queryFn: async () => {
        const [s, tr, td, on, term, inact] = await Promise.all([
          getAdminDashboardStats().catch(() => null),
          getMonthlyTrend(12).catch((): MonthlyTrend => []),
          getLeaveTypeDistribution().catch((): TypeDistribution => []),
          getRecentOnboardings(30).catch(() => [] as RecentOnboarding[]),
          getRecentTerminations(30).catch(() => [] as RecentTermination[]),
          getInactiveEmployees(180).catch(() => [] as InactiveEmployee[]),
        ]);
        return { inactive: inact, onboardings: on, stats: s, terminations: term, trend: tr, typeDist: td };
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToLeaveRequests({}, () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKey });
    });
    return unsubscribe;
  }, [queryClient]);
  const { inactive = [], onboardings = [], stats = null, terminations = [], trend = [], typeDist = [] } = dashboardQuery.data ?? {};
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  // Top-3 most urgent pending requests, oldest-first (highest aging first).
  const pending = useMemo(() => {
    return requests
      .filter((r) => isPending(r.status))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [requests]);

  // "Ausentes hoy" sale de la lista ya cargada: ausencias aprobadas que
  // solapan la fecha de hoy. Se cuentan empleados, no solicitudes.
  const absentToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const employees = new Set<string>();
    for (const request of requests) {
      if (request.status === "approved" && request.start_date <= today && request.end_date >= today) {
        employees.add(request.employee_id);
      }
    }
    return employees.size;
  }, [requests]);

  const adminFirstName = profile?.full_name.split(" ")[0] ?? "RH";

  return (
    <AdminShell>
      <div className="min-h-dvh bg-slate-50">
        <section className="page-wrap flex flex-col gap-5 pb-24 pt-4 md:pt-6">

          <header className="animate-fade-up flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">{adminFirstName}</h2>
            </div>
            {/* Única acción que no vive en el sidebar. */}
            <Button aria-label="Agregar empleado" className="shrink-0" onClick={() => navigate("/admin/employees", { state: { addEmployee: true } })}>
              <UserPlus aria-hidden="true" className="size-5" />
              <span className="hidden sm:inline">Agregar empleado</span>
            </Button>
          </header>

          <BirthdayHero />

          <FocusBlock
            absentToday={absentToday}
            isLoading={isRequestsLoading}
            pending={pending}
            prefs={prefs}
            stats={stats}
            onCustomize={() => setCustomizeOpen(true)}
          />

          {preferences.birthdayVisibility && birthdayMembers.length > 0 ? (
            <BirthdayStrip members={birthdayMembers} />
          ) : null}

          {prefs.showCharts ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TrendChart data={trend} />
              <TypeDistributionChart data={typeDist} />
            </div>
          ) : null}

          {prefs.showMovements ? (
            <StaffMovementsCard inactive={inactive} onboardings={onboardings} terminations={terminations} />
          ) : null}

          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      <CustomizeInicioSheet
        isOpen={isCustomizeOpen}
        prefs={prefs}
        onChange={update}
        onClose={() => setCustomizeOpen(false)}
      />
    </AdminShell>
  );
}
