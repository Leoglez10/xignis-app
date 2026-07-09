import { ArrowLeft, CalendarClock, CalendarDays, ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  formatDateEs,
  formatDateRangeEs,
  overlapsToday,
  startsWithinDays,
  todayIso,
} from "../../../lib/date";
import type { LeaveRequest, Profile } from "../../../lib/database.types";
import {
  formatDateRange,
  leaveTypeLabel,
  listEmployeeLeaveRequests,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";
import { leaveTypeConfig, statusTone } from "../../leave-requests/config";
import { getTeamMemberProfile } from "../../profiles/services/profileService";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

export function ManagerMemberDetailScreen() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [member, setMember] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!memberId) {
      setError("Miembro no encontrado.");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const profile = await getTeamMemberProfile(memberId);
        setMember(profile);
        const history = await listEmployeeLeaveRequests(memberId);
        setRequests(history);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el historial.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [memberId]);

  const today = todayIso();
  const activeToday = useMemo(
    () =>
      requests.find(
        (r) =>
          r.status === "approved" && overlapsToday(r.start_date, r.end_date),
      ),
    [requests],
  );

  const upcoming = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === "approved" && startsWithinDays(r.start_date, 30),
      ),
    [requests],
  );

  const history = useMemo(
    () => [...requests].sort(sortDescByCreated),
    [requests],
  );

  const stats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let thisMonth = 0;
    for (const r of requests) {
      if (r.status === "approved") approved += 1;
      if (r.status === "pending_manager" || r.status === "pending_hr" || r.status === "approved_by_manager") pending += 1;
      if (r.start_date.slice(0, 7) === today.slice(0, 7)) thisMonth += 1;
    }
    return { approved, pending, thisMonth };
  }, [requests, today]);

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
        <p className="px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] text-sm font-semibold text-[var(--color-muted)]">
          Cargando…
        </p>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
        <div className="mx-auto w-full max-w-3xl px-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
          <button
            aria-label="Regresar"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/manager/team")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error ?? "No se encontró el miembro del equipo."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
          <button
            aria-label="Regresar a Mi equipo"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/manager/team")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <div className="flex flex-1 items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-emerald-100 text-base font-black text-emerald-700">
              {initials(member.full_name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black md:text-3xl">{member.full_name}</h1>
              <p className="truncate text-sm text-[var(--color-muted)]">{member.job_title ?? "Sin puesto"}</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${activeToday ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
                {activeToday ? "Ausente hoy" : "Disponible"}
              </span>
            </div>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-3 gap-3" aria-label="Resumen">
          <article className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
            <p className="text-xs font-black text-[var(--color-muted)]">Aprobadas</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-text)]">{stats.approved}</p>
          </article>
          <article className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
            <p className="text-xs font-black text-[var(--color-muted)]">Pendientes</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-text)]">{stats.pending}</p>
          </article>
          <article className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
            <p className="text-xs font-black text-[var(--color-muted)]">Este mes</p>
            <p className="mt-1 text-2xl font-black text-[var(--color-text)]">{stats.thisMonth}</p>
          </article>
        </section>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {activeToday ? (
          <section className="mb-5 rounded-[20px] bg-emerald-50 p-4 ring-1 ring-emerald-200" aria-labelledby="active-title">
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-5 text-emerald-700" />
              <h2 className="text-sm font-black text-emerald-900" id="active-title">Permiso activo ahora</h2>
            </div>
            <p className="text-sm font-black text-emerald-900">{leaveTypeLabel[activeToday.leave_type]}</p>
            <p className="mt-1 text-sm text-emerald-800">
              {formatDateRangeEs(activeToday.start_date, activeToday.end_date)}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Vuelve el {formatDateEs(shiftISO(activeToday.end_date, 1))}
            </p>
          </section>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="mb-5" aria-labelledby="upcoming-title">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
              <h2 className="text-base font-black" id="upcoming-title">Próximas ausencias (30 días)</h2>
            </div>
            <ul className="stagger space-y-2">
              {upcoming.map((r) => (
                <li className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200" key={r.id}>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-black ${leaveTypeConfig[r.leave_type].avatarTone}`}>
                    {initials(member.full_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{leaveTypeLabel[r.leave_type]}</span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">{formatDateRangeEs(r.start_date, r.end_date)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="history-title">
          <div className="mb-3 flex items-center gap-2">
            <Clock aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
            <h2 className="text-base font-black" id="history-title">Historial completo</h2>
          </div>
          <ul className="stagger space-y-2">
            {history.length === 0 ? (
              <li className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                Sin solicitudes registradas.
              </li>
            ) : null}
            {history.map((r) => (
              <li key={r.id}>
                <button
                  className="press flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200"
                  type="button"
                  onClick={() => navigate(`/manager/requests/${r.id}`)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{leaveTypeLabel[r.leave_type]}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDateRange(r)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function sortDescByCreated(a: LeaveRequest, b: LeaveRequest) {
  return b.created_at.localeCompare(a.created_at);
}

function shiftISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}