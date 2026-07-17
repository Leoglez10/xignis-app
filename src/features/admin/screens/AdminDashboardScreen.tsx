import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { AdminQuickActions } from "../components/AdminQuickActions";
import { AdminShell } from "../components/adminNav";
import { InactiveEmployeesWidget } from "../components/InactiveEmployeesWidget";
import { KpiGrid } from "../components/KpiGrid";
import { RecentOnboardingsWidget } from "../components/RecentOnboardingsWidget";
import { RecentTerminationsWidget } from "../components/RecentTerminationsWidget";
import { StagnantRequestsWidget } from "../components/StagnantRequestsWidget";
import { AgingBadge } from "../../../components/ui/AgingBadge";
import { TrendChart } from "../components/TrendChart";
import { TypeDistributionChart } from "../components/TypeDistributionChart";
import { leaveTypeLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";
import { useAuth } from "../../session/AuthContext";
import { useHrLeaveRequests } from "../hooks/useHrLeaveRequests";
import {
  getAdminDashboardStats,
  getInactiveEmployees,
  getLeaveTypeDistribution,
  getMonthlyTrend,
  getRecentOnboardings,
  getRecentTerminations,
  getStagnantRequests,
  type InactiveEmployee,
  type MonthlyTrend,
  type RecentOnboarding,
  type RecentTermination,
  type StagnantRequest,
  type TypeDistribution,
} from "../services/dashboardService";

function isPending(status: LeaveRequestWithEmployee["status"]): boolean {
  return status === "pending_hr" || status === "approved_by_manager";
}

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Leave-requests list comes from the shared hook (also used by the
  // "Solicitudes" screen) so the summary preview stays light and the list is
  // fetched once. The heavy analytics live in the query below.
  const { requests } = useHrLeaveRequests();

  const dashboardKey = ["dashboard", "admin"] as const;
  const dashboardQuery = useQuery({
    queryKey: dashboardKey,
    queryFn: async () => {
        const [s, tr, td, st, on, term, inact] = await Promise.all([
          getAdminDashboardStats().catch(() => null),
          getMonthlyTrend(12).catch((): MonthlyTrend => []),
          getLeaveTypeDistribution().catch((): TypeDistribution => []),
          getStagnantRequests(72).catch(() => [] as StagnantRequest[]),
          getRecentOnboardings(30).catch(() => [] as RecentOnboarding[]),
          getRecentTerminations(30).catch(() => [] as RecentTermination[]),
          getInactiveEmployees(180).catch(() => [] as InactiveEmployee[]),
        ]);
        return { inactive: inact, onboardings: on, stagnant: st, stats: s, terminations: term, trend: tr, typeDist: td };
    },
  });

  useEffect(() => {
    const unsubscribe = subscribeToLeaveRequests({}, () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKey });
    });
    return unsubscribe;
  }, [queryClient]);
  const { inactive = [], onboardings = [], stagnant = [], stats = null, terminations = [], trend = [], typeDist = [] } = dashboardQuery.data ?? {};
  const error = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;
  const isLoading = dashboardQuery.isLoading;

  // Top-3 most urgent pending requests, oldest-first (highest aging first).
  const pending = useMemo(() => {
    return requests
      .filter((r) => isPending(r.status))
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [requests]);
  const topUrgent = useMemo(() => pending.slice(0, 3), [pending]);

  const adminFirstName = profile?.full_name.split(" ")[0] ?? "RH";

  return (
    <AdminShell>
      <div className="min-h-dvh">
        <section className="flex flex-col gap-5 bg-slate-50 p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] md:p-6 md:pb-24">

          <header className="animate-fade-up">
            <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">{adminFirstName}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isLoading
                ? "Cargando…"
                : stats
                  ? `${pending.length} solicitudes pendientes · ${stats.approvalRate30d}% aprobación 30d`
                  : "Sin datos"}
            </p>
          </header>

          <AdminQuickActions />

          {stats ? <KpiGrid stats={stats} /> : null}

          <section className="rounded-[24px] bg-[var(--card-muted)] p-4" aria-labelledby="admin-urgent-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-black md:text-xl" id="admin-urgent-title">
                Próximas 3 urgentes
              </h2>
              <NavLink
                to="/admin/requests"
                className="press inline-flex items-center gap-1 text-xs font-black text-[var(--color-muted)]"
              >
                Ver todas ({pending.length})
                <ArrowRight aria-hidden="true" className="size-4" />
              </NavLink>
            </div>

            {topUrgent.length === 0 ? (
              <p className="rounded-[20px] bg-[var(--card-bg)] p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-[var(--card-border)]">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {topUrgent.map((request) => (
                  <li key={request.id}>
                    <button
                      className="press flex w-full items-center gap-3 rounded-[20px] bg-[var(--card-bg)] p-3 text-left ring-1 ring-[var(--card-border)]"
                      type="button"
                      onClick={() => navigate(`/admin/requests/${request.id}`)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">
                          {request.employee?.full_name ?? "Empleado"}
                        </span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">
                          {leaveTypeLabel[request.leave_type]}
                        </span>
                      </span>
                      <AgingBadge request={request} />
                      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <TrendChart data={trend} />
            <TypeDistributionChart data={typeDist} />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StagnantRequestsWidget items={stagnant} />
            <RecentOnboardingsWidget items={onboardings} />
            <RecentTerminationsWidget items={terminations} />
            <InactiveEmployeesWidget items={inactive} />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </AdminShell>
  );
}
