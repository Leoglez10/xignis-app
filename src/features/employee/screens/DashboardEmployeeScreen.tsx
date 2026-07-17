import {
  CalendarPlus,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveRequest } from "../../../lib/database.types";
import type { Profile } from "../../../lib/database.types";
import { logout } from "../../auth/services/authService";
import {
  formatDateRange,
  getMyVacationBalance,
  leaveTypeLabel,
  listAbsencesForEmployeesToday,
  statusLabel,
  type VacationBalance,
} from "../../leave-requests/services/leaveRequestService";
import { useAuth } from "../../session/AuthContext";
import { isInFlight } from "../../leave-requests/services/leaveRequestProgressService";
import { InProgressRequestCard } from "../../leave-requests/components/InProgressRequestCard";
import { listMyPeers } from "../../profiles/services/profileService";
import { statusTone } from "../../leave-requests/config";
import { daysFromToday, overlapsToday, todayIso } from "../../../lib/date";
import { ActivePermitBanner } from "../components/ActivePermitBanner";
import { EmployeeDashboardSkeleton } from "../components/EmployeeDashboardSkeleton";
import { NextAbsenceCard } from "../components/NextAbsenceCard";
import { PeersStrip } from "../components/PeersStrip";
import { VacationBalanceCard } from "../components/VacationBalanceCard";
import { useLeaveRequests } from "../../leave-requests/hooks/useLeaveRequests";

export function DashboardEmployeeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [today] = useState(todayIso);
  const requestsQuery = useLeaveRequests("mine", profile?.id);
  const balanceQuery = useQuery<VacationBalance | null>({ queryKey: ["vacation-balance", profile?.id], queryFn: () => getMyVacationBalance().catch(() => null) });
  const peersQuery = useQuery<Profile[]>({ queryKey: ["peers", profile?.id], queryFn: () => listMyPeers().catch(() => []) });
  const peers = peersQuery.data ?? [];
  const peerIds = useMemo(() => peers.map((peer) => peer.id), [peers]);
  const absencesQuery = useQuery<LeaveRequest[]>({ enabled: peerIds.length > 0, queryKey: ["peer-absences", today, peerIds], queryFn: async () => (await listAbsencesForEmployeesToday(peerIds)) as LeaveRequest[] });
  const requests = requestsQuery.data ?? [];
  const balance = balanceQuery.data ?? null;
  const peerAbsences = absencesQuery.data ?? [];
  const isLoading = requestsQuery.isLoading || balanceQuery.isLoading || peersQuery.isLoading;
  const refreshing = requestsQuery.isFetching || balanceQuery.isFetching || peersQuery.isFetching || absencesQuery.isFetching;
  const error = requestsQuery.error instanceof Error ? requestsQuery.error.message : null;

  const inFlightRequest = useMemo(
    () => requests.find((r) => isInFlight(r.status)) ?? null,
    [requests],
  );

  async function handleRefresh() {
    await Promise.all([requestsQuery.refetch(), balanceQuery.refetch(), peersQuery.refetch(), absencesQuery.refetch()]);
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

  const recentRequests = requests.slice(0, 2);


  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))] lg:px-8">
        <button
          aria-label="Crear nuevo permiso"
          className="group press animate-fade-up relative overflow-hidden rounded-[24px] bg-slate-950 p-5 text-left text-white shadow-xl shadow-slate-200 lg:p-7"
          type="button"
          onClick={() => navigate("/employee/request")}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--color-primary)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <CalendarPlus aria-hidden="true" className="size-6" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">2 min</span>
          </div>
          <h2 className="text-2xl font-black">Nuevo permiso</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Vacaciones o permisos, en un par de toques.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
            Tocar para empezar
            <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
          <ChevronRight
            aria-hidden="true"
            className="absolute right-5 top-1/2 size-7 -translate-y-1/2 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/60"
          />
        </button>

        <button
          className="press animate-fade-up mt-4 flex w-full items-center justify-between gap-4 rounded-[24px] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-left shadow-sm"
          type="button"
          onClick={() => navigate("/employee/requests")}
        >
          <span className="flex items-center gap-4">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl"
              style={{
                background: pendingCount > 0 ? "var(--stat-pending)" : "var(--stat-upcoming)",
                color: pendingCount > 0 ? "var(--stat-pending-text)" : "var(--stat-upcoming-text)",
              }}
            >
              {pendingCount > 0 ? (
                <Clock aria-hidden="true" className="size-6" />
              ) : (
                <Sparkles aria-hidden="true" className="size-6" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-black leading-none text-[var(--color-text)]">
                {isLoading ? "—" : pendingCount}
              </span>
              <span className="mt-1 block text-sm font-semibold text-[var(--color-muted)]">
                {isLoading
                  ? "Cargando…"
                  : pendingCount === 0
                    ? "Sin pendientes · ver historial"
                    : pendingCount === 1
                      ? "Solicitud pendiente · ver todas"
                      : "Solicitudes pendientes · ver todas"}
              </span>
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
        </button>

        {isLoading ? (
          <div className="mt-5">
            <EmployeeDashboardSkeleton />
          </div>
        ) : (
          <>
            {inFlightRequest ? (
              <div className="mt-5">
                <InProgressRequestCard
                  requestId={inFlightRequest.id}
                  title="Solicitud en curso"
                  onView={(id) => navigate(`/employee/requests/${id}`)}
                />
              </div>
            ) : null}

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
              <div className="stagger space-y-3">
                {recentRequests.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-8 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Sparkles aria-hidden="true" className="size-6" />
                    </span>
                    <p className="text-sm font-black text-[var(--color-text)]">
                      Aún no tienes solicitudes
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
              {requests.length > 0 ? (
                <button
                  className="press mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] py-3 text-sm font-black text-[var(--color-text)]"
                  type="button"
                  onClick={() => navigate("/employee/requests")}
                >
                  Ver historial completo
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </section>
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
