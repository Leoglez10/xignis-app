import {
  CalendarPlus,
  ChevronRight,
  Clock,
  LogOut,
  Plus,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveRequest } from "../../../lib/database.types";
import type { Profile } from "../../../lib/database.types";
import { logout } from "../../auth/services/authService";
import { NotificationBell } from "../../notifications/NotificationBell";
import { useAuth } from "../../session/AuthContext";
import {
  formatDateRange,
  getMyVacationBalance,
  leaveTypeLabel,
  listAbsencesForEmployeesToday,
  listMyLeaveRequests,
  statusLabel,
  type VacationBalance,
} from "../../leave-requests/services/leaveRequestService";
import { listMyPeers } from "../../profiles/services/profileService";
import { statusTone } from "../../leave-requests/config";
import { daysFromToday, overlapsToday, todayIso } from "../../../lib/date";
import { greetingFor, longDateEs } from "../../../lib/greeting";
import { ActivePermitBanner } from "../components/ActivePermitBanner";
import { EmployeeDashboardSkeleton } from "../components/EmployeeDashboardSkeleton";
import { NextAbsenceCard } from "../components/NextAbsenceCard";
import { PeersStrip } from "../components/PeersStrip";
import { VacationBalanceCard } from "../components/VacationBalanceCard";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
];

function matchesFilter(status: LeaveRequest["status"], filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "pending") {
    return (
      status === "pending_manager" ||
      status === "approved_by_manager" ||
      status === "pending_hr"
    );
  }
  if (filter === "approved") return status === "approved";
  if (filter === "rejected") return status === "rejected" || status === "rejected_by_manager";
  return true;
}

export function DashboardEmployeeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [peers, setPeers] = useState<Profile[]>([]);
  const [peerAbsences, setPeerAbsences] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [today] = useState(todayIso);

  const loadAll = useCallback(async () => {
    try {
      const [list, bal, peerList] = await Promise.all([
        listMyLeaveRequests(),
        getMyVacationBalance().catch(() => null),
        listMyPeers().catch(() => [] as Profile[]),
      ]);
      setRequests(list ?? []);
      setBalance(bal);
      setPeers(peerList);
      const peerIds = peerList.map((p) => p.id);
      const todayAbs = await listAbsencesForEmployeesToday(peerIds).catch(() => []);
      setPeerAbsences(todayAbs as LeaveRequest[]);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar tus solicitudes.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    loadAll().finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const pendingCount = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.status === "pending_manager" ||
          request.status === "approved_by_manager" ||
          request.status === "pending_hr",
      ).length,
    [requests],
  );
  const approvedCount = useMemo(
    () => requests.filter((request) => request.status === "approved").length,
    [requests],
  );

  const activePermit = useMemo(
    () => requests.find((r) => r.status === "approved" && overlapsToday(r.start_date, r.end_date, new Date(today))),
    [requests, today],
  );
  const nextAbsence = useMemo(() => {
    const upcoming = requests
      .filter((r) => r.status === "approved" && r.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return upcoming[0] ?? null;
  }, [requests, today]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => matchesFilter(r.status, filter));
  }, [requests, filter]);
  const recentRequests = filteredRequests.slice(0, 6);

  const firstName = profile?.full_name.split(" ")[0] ?? "equipo";
  const greeting = greetingFor(new Date(today));
  const dateLabel = longDateEs(new Date(today));

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-7 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8">
        <header className="animate-fade-up mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-[var(--color-muted)]">
              {dateLabel}
            </p>
            <h1 className="mt-1 text-3xl font-black text-[var(--color-text)]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isLoading
                ? "Cargando solicitudes"
                : pendingCount === 0
                  ? "Sin solicitudes pendientes"
                  : `${pendingCount} ${pendingCount === 1 ? "solicitud pendiente" : "solicitudes pendientes"}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button
              aria-label="Mi perfil"
              className="press grid size-12 place-items-center rounded-full bg-[var(--color-surface)] text-sm font-black text-[var(--color-text)]"
              type="button"
              onClick={() => navigate("/profile")}
            >
              {profile ? getInitials(profile.full_name) : <LogOut aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </header>

        <button
          className="press animate-fade-up rounded-[24px] bg-slate-950 p-5 text-left text-white shadow-xl shadow-slate-200 lg:p-7"
          type="button"
          onClick={() => navigate("/employee/request")}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary)]">
              <CalendarPlus aria-hidden="true" className="size-6" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">2 min</span>
          </div>
          <h2 className="text-2xl font-black">Nuevo permiso</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Selecciona fechas, tipo y pendientes sin hablar con RH antes.
          </p>
        </button>

        {isLoading ? (
          <div className="mt-5">
            <EmployeeDashboardSkeleton />
          </div>
        ) : (
          <>
            {activePermit ? (
              <div className="mt-5">
                <ActivePermitBanner request={activePermit} />
              </div>
            ) : null}

            {balance && balance.quota > 0 ? (
              <div className="mt-5">
                <VacationBalanceCard balance={balance} />
              </div>
            ) : null}

            {nextAbsence && !activePermit ? (
              <div className="mt-5">
                <NextAbsenceCard request={nextAbsence} />
              </div>
            ) : null}

            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen rápido">
              <div className="rounded-2xl bg-[var(--color-surface)] p-4">
                <p className="text-sm text-[var(--color-muted)]">Pendientes</p>
                <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{pendingCount}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-[var(--color-muted)]">Aprobadas</p>
                <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{approvedCount}</p>
              </div>
              {balance && balance.quota > 0 ? (
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-sm text-[var(--color-muted)]">Días restantes</p>
                  <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{balance.available}</p>
                </div>
              ) : null}
              {nextAbsence ? (
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm text-[var(--color-muted)]">Próximo</p>
                  <p className="mt-1 text-3xl font-black text-[var(--color-text)]">
                    {Math.max(0, daysFromToday(nextAbsence.start_date, new Date(today)))}
                    <span className="ml-1 text-sm font-bold text-[var(--color-muted)]">días</span>
                  </p>
                </div>
              ) : null}
            </section>

            {peers.length > 0 ? (
              <PeersStrip absences={peerAbsences} peers={peers} />
            ) : null}

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <section className="mt-7" aria-labelledby="recent-title">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-[var(--color-text)]" id="recent-title">
                  Actividad reciente
                </h2>
                <button
                  className="press text-sm font-black text-[var(--color-muted)]"
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? "Actualizando…" : "Actualizar"}
                </button>
              </div>
              <div
                aria-label="Filtro de solicitudes"
                className="mb-3 flex flex-wrap gap-2"
                role="group"
              >
                {FILTERS.map((f) => (
                  <button
                    aria-pressed={filter === f.key}
                    className={`press rounded-full px-3 py-1.5 text-xs font-black transition ${
                      filter === f.key
                        ? "bg-slate-950 text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-muted)]"
                    }`}
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="stagger space-y-3">
                {recentRequests.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-8 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Sparkles aria-hidden="true" className="size-6" />
                    </span>
                    <p className="text-sm font-black text-[var(--color-text)]">
                      {requests.length === 0
                        ? "Aún no tienes solicitudes"
                        : "Sin resultados para este filtro"}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Toca el botón verde para crear la primera.
                    </p>
                    {requests.length === 0 ? (
                      <Button onClick={() => navigate("/employee/request")}>
                        <Plus aria-hidden="true" className="size-4" />
                        Crear solicitud
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {recentRequests.map((request) => (
                  <button
                    className="press flex min-h-[72px] w-full items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4 text-left"
                    key={request.id}
                    type="button"
                    onClick={() => navigate(`/employee/requests/${request.id}`)}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[var(--color-text)]">
                        {leaveTypeLabel[request.leave_type]}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                        {formatDateRange(request)} · <Clock aria-hidden="true" className="inline size-3" />{" "}
                        {timeAgo(request.created_at)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[request.status]}`}
                      >
                        {statusLabel[request.status]}
                      </span>
                      <ChevronRight aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-auto pt-8">
              <Button className="w-full" onClick={() => navigate("/employee/request")}>
                <Plus aria-hidden="true" className="size-5" />
                Nueva solicitud
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `hace ${w} sem`;
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });
}
