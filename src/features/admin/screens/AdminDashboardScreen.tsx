import { CheckCircle2, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminBottomNav } from "../components/adminNav";
import { AdminFloatingActions } from "../components/AdminFloatingActions";
import { AdminQuickActions } from "../components/AdminQuickActions";
import { AdminRequestCard } from "../components/AdminRequestCard";
import { InactiveEmployeesWidget } from "../components/InactiveEmployeesWidget";
import { KpiGrid } from "../components/KpiGrid";
import { RecentOnboardingsWidget } from "../components/RecentOnboardingsWidget";
import { StagnantRequestsWidget } from "../components/StagnantRequestsWidget";
import { TrendChart } from "../components/TrendChart";
import { TypeDistributionChart } from "../components/TypeDistributionChart";
import { leaveTypeLabel, listHrLeaveRequests, statusLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { useAuth } from "../../session/AuthContext";
import {
  getAdminDashboardStats,
  getInactiveEmployees,
  getLeaveTypeDistribution,
  getMonthlyTrend,
  getRecentOnboardings,
  getStagnantRequests,
  type AdminDashboardStats,
  type InactiveEmployee,
  type MonthlyTrend,
  type RecentOnboarding,
  type StagnantRequest,
  type TypeDistribution,
} from "../services/dashboardService";

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "all", label: "Todas" },
];

function matchesFilter(status: LeaveRequestWithEmployee["status"], filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "pending_hr" || status === "approved_by_manager";
  if (filter === "approved") return status === "approved";
  if (filter === "rejected") return status === "rejected" || status === "rejected_by_manager";
  return false;
}

function exportCsv(rows: LeaveRequestWithEmployee[]) {
  const header = ["Empleado", "Puesto", "Tipo", "Inicio", "Fin", "Estado", "Enviada"];
  const body = rows.map((r) => [
    r.employee?.full_name ?? "",
    r.employee?.job_title ?? "",
    leaveTypeLabel[r.leave_type],
    r.start_date,
    r.end_date,
    statusLabel[r.status],
    new Date(r.created_at).toLocaleString(),
  ]);
  const csv = [header, ...body]
    .map((cells) => cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xignis-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [trend, setTrend] = useState<MonthlyTrend>([]);
  const [typeDist, setTypeDist] = useState<TypeDistribution>([]);
  const [stagnant, setStagnant] = useState<StagnantRequest[]>([]);
  const [onboardings, setOnboardings] = useState<RecentOnboarding[]>([]);
  const [inactive, setInactive] = useState<InactiveEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [data, s, tr, td, st, on, inact] = await Promise.all([
          listHrLeaveRequests(),
          getAdminDashboardStats().catch(() => null),
          getMonthlyTrend(12).catch((): MonthlyTrend => []),
          getLeaveTypeDistribution().catch((): TypeDistribution => []),
          getStagnantRequests(72).catch(() => [] as StagnantRequest[]),
          getRecentOnboardings(30).catch(() => [] as RecentOnboarding[]),
          getInactiveEmployees(180).catch(() => [] as InactiveEmployee[]),
        ]);
        setRequests(data);
        setStats(s);
        setTrend(tr);
        setTypeDist(td);
        setStagnant(st);
        setOnboardings(on);
        setInactive(inact);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las solicitudes.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (!matchesFilter(r.status, filter)) return false;
      if (q && !(r.employee?.full_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, filter, query]);

  const adminFirstName = profile?.full_name.split(" ")[0] ?? "RH";

  return (
    <main className="min-h-dvh bg-slate-100 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="min-h-dvh">
        <section className="flex flex-col gap-5 bg-slate-50 p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] md:p-6 md:pb-24">
          <AdminFloatingActions />

          <header className="animate-fade-up">
            <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">{adminFirstName}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isLoading
                ? "Cargando…"
                : stats
                  ? `${stats.pendingCount} solicitudes pendientes · ${stats.approvalRate30d}% aprobación 30d`
                  : "Sin datos"}
            </p>
          </header>

          <AdminQuickActions />

          {stats ? <KpiGrid stats={stats} /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <TrendChart data={trend} />
            <TypeDistributionChart data={typeDist} />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StagnantRequestsWidget items={stagnant} />
            <RecentOnboardingsWidget items={onboardings} />
            <InactiveEmployeesWidget items={inactive} />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <section className="flex flex-col gap-3 rounded-[20px] bg-white p-4 ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="sr-only">Buscar solicitudes</span>
              <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                className="h-11 w-full rounded-full bg-slate-50 pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                placeholder="Buscar empleado"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white"
              type="button"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
            >
              <Download aria-hidden="true" className="size-4" />
              Exportar CSV
            </button>
          </section>

          <div aria-label="Filtro de solicitudes" className="flex flex-wrap gap-2" role="group">
            {FILTERS.map((f) => (
              <button
                aria-pressed={filter === f.key}
                className={`press rounded-full px-4 py-2 text-xs font-black transition ${
                  filter === f.key ? "bg-slate-950 text-white" : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
                }`}
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <section aria-labelledby="recent-title">
            <h2 className="mb-3 text-base font-black md:text-lg" id="recent-title">
              Solicitudes {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div className="h-20 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={i} />
                ))}
              </div>
            ) : (
              <ul className="stagger space-y-3">
                {filtered.length === 0 ? (
                  <li className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-10 text-center ring-1 ring-slate-200">
                    <CheckCircle2 aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
                    <p className="text-sm font-semibold text-[var(--color-muted)]">
                      No hay solicitudes para este filtro.
                    </p>
                  </li>
                ) : null}
                {filtered.map((request) => (
                  <AdminRequestCard
                    key={request.id}
                    onClick={() => navigate(`/admin/requests/${request.id}`)}
                    request={request}
                  />
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
      <AdminBottomNav />
    </main>
  );
}
