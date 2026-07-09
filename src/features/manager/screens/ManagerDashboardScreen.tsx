import { AlertTriangle, CalendarDays, CheckCircle2, UserCircle, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateRangeEs, eachDayIso, overlapsToday, startsWithinDays, todayIso } from "../../../lib/date";
import { roleLabel } from "../../profiles/services/profileService";
import { NotificationBell } from "../../notifications/NotificationBell";
import { useAuth } from "../../session/AuthContext";
import {
  getManagerApprovalSlaHours,
  listManagerLeaveRequests,
  listTeamUpcomingAbsences,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { listMyTeam } from "../../profiles/services/profileService";
import type { Profile } from "../../../lib/database.types";
import { STATS_CONFIG, UPCOMING_WINDOW_DAYS } from "../dashboard.config";
import { useDashboardPrefs } from "../useDashboardPrefs";
import { AgendaItem } from "../components/AgendaItem";
import { AgingBadge } from "../components/AgingBadge";
import { BirthdayStrip } from "../components/BirthdayStrip";
import { BulkActionsBar } from "../components/BulkActionsBar";
import { CoverageHeatmap } from "../components/CoverageHeatmap";
import { ManagerBottomNav } from "../components/ManagerBottomNav";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { PendingRequestCard } from "../components/PendingRequestCard";
import { RefreshBoundary } from "../components/RefreshBoundary";
import { SlaCard } from "../components/SlaCard";
import { StatCard } from "../components/StatCard";
import { TeamMemberRow } from "../components/TeamMemberRow";
import { TopRequesters } from "../components/TopRequesters";

type SlaInfo = { avgHours: number | null; count: number };

type DashboardState = {
  absences: LeaveRequestWithEmployee[];
  error: string | null;
  isLoading: boolean;
  pending: LeaveRequestWithEmployee[];
  sla: SlaInfo | null;
  team: Profile[];
};

type DashboardAction =
  | { type: "loading" }
  | {
      absences: LeaveRequestWithEmployee[];
      pending: LeaveRequestWithEmployee[];
      sla: SlaInfo | null;
      team: Profile[];
      type: "loaded";
    }
  | { message: string; type: "error" };

const INITIAL_STATE: DashboardState = {
  absences: [],
  error: null,
  isLoading: true,
  pending: [],
  sla: null,
  team: [],
};

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };
    case "loaded":
      return {
        absences: action.absences,
        error: null,
        isLoading: false,
        pending: action.pending,
        sla: action.sla,
        team: action.team,
      };
    case "error":
      return { ...state, error: action.message, isLoading: false };
    default:
      return state;
  }
}

export function ManagerDashboardScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { prefs } = useDashboardPrefs();

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isMounted = useRef(true);
  const mountedOnce = useRef(false);
  const todayRef = useRef(todayIso());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadAll = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      const [pending, upcoming, members, sla] = await Promise.all([
        listManagerLeaveRequests(),
        listTeamUpcomingAbsences(),
        listMyTeam().catch(() => [] as Profile[]),
        getManagerApprovalSlaHours(30).catch(() => null),
      ]);
      if (!isMounted.current) return;
      dispatch({ absences: upcoming, pending, sla, team: members, type: "loaded" });
    } catch (loadError) {
      if (!isMounted.current) return;
      dispatch({ message: loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos.", type: "error" });
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const { absences, error, isLoading, pending, sla, team } = state;

  const absentEmployeeIds = useMemo(
    () => new Set(absences.filter((a) => overlapsToday(a.start_date, a.end_date)).map((a) => a.employee_id)),
    [absences],
  );

  const upcomingWeekCount = useMemo(
    () => absences.filter((a) => startsWithinDays(a.start_date, UPCOMING_WINDOW_DAYS)).length,
    [absences],
  );

  const overlapAlert = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const a of absences) {
      for (const iso of eachDayIso(a.start_date, a.end_date)) {
        byDay.set(iso, (byDay.get(iso) ?? 0) + 1);
      }
    }
    let peakDate: string | null = null;
    let peakCount = 0;
    for (const [date, count] of byDay) {
      if (count > peakCount) {
        peakCount = count;
        peakDate = date;
      }
    }
    if (!peakDate || peakCount < 2) return null;
    return { count: peakCount, date: peakDate };
  }, [absences]);

  const agedCount = useMemo(() => {
    const cutoff = Date.now() - 48 * 3_600_000;
    return pending.filter((p) => new Date(p.created_at).getTime() < cutoff).length;
  }, [pending]);

  const managerFirstName = profile?.full_name.split(" ")[0] ?? "Jefe";
  const roleBadge = profile ? roleLabel[profile.role] : "Jefe";

  const statsState = useMemo(
    () => ({
      absences,
      absentTodayCount: absentEmployeeIds.size,
      pending,
      teamCount: team.length,
      upcomingWeekCount,
    }),
    [absences, absentEmployeeIds, pending, team, upcomingWeekCount],
  );

  const markMountOnce = () => {
    if (mountedOnce.current) return false;
    mountedOnce.current = true;
    return true;
  };

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  return (
    <main className="min-h-dvh bg-slate-100 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <RefreshBoundary onRefresh={loadAll}>
        <section className="grid min-h-dvh gap-5 p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] md:p-6 md:pb-24 lg:grid-cols-[1fr_var(--aside-width)]">
          <div className="min-w-0 bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6">
            <header className="animate-fade-up mb-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-[var(--color-muted)]">{roleBadge}</p>
                  <h1 className="mt-1 text-2xl font-black md:text-3xl">{managerFirstName}</h1>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {isLoading
                      ? "Cargando…"
                      : agedCount > 0
                        ? `${pending.length} pendientes · ${agedCount} con más de 48 h`
                        : `${pending.length} solicitudes pendientes`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <NotificationBell />
                  <button
                    aria-label="Mi perfil"
                    className="press grid size-11 place-items-center rounded-full bg-[var(--card-muted)] text-[var(--color-muted)] ring-1 ring-[var(--card-border)]"
                    onClick={() => navigate("/profile")}
                    type="button"
                  >
                    <UserCircle aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
              <button
                className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--card-muted)] px-4 text-sm font-black text-[var(--color-text)] ring-1 ring-[var(--card-border)] lg:w-auto lg:justify-self-end"
                onClick={() => navigate("/manager/team")}
                type="button"
              >
                <Users aria-hidden="true" className="size-4" />
                Mi equipo
              </button>
            </header>

            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <section
                  className="animate-fade-up stagger mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"
                  aria-label="Resumen del equipo"
                >
                  {STATS_CONFIG.map((s) => (
                    <StatCard
                      key={s.key}
                      label={s.label}
                      tone={s.tone}
                      value={s.compute(statsState)}
                    />
                  ))}
                  {sla ? <SlaCard avgHours={sla.avgHours} count={sla.count} /> : null}
                </section>

                {agedCount > 0 ? (
                  <div className="animate-fade-up mb-5 flex gap-3 rounded-2xl bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">{agedCount} solicitud{agedCount === 1 ? "" : "es"} con más de 48 h</p>
                      <p className="mt-0.5 text-xs text-rose-800/80">
                        Revisa las más antiguas para mantener el SLA de tu equipo.
                      </p>
                    </div>
                  </div>
                ) : null}

                {overlapAlert ? (
                  <div className="animate-fade-up mb-5 flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-200">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <p className="text-sm leading-6">
                      El {formatDateRangeEs(overlapAlert.date, overlapAlert.date)} hay {overlapAlert.count} personas ausentes. Revisa cobertura.
                    </p>
                  </div>
                ) : null}

                {error ? (
                  <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}

                <section className="rounded-[24px] bg-[var(--card-muted)] p-4" aria-labelledby="manager-pending-title">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-black md:text-xl" id="manager-pending-title">
                      Pendientes de tu equipo
                    </h2>
                    <span className="rounded-full bg-[var(--card-bg)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                      {pending.length} abiertas
                    </span>
                  </div>

                  <ul className="stagger space-y-3">
                    {pending.length === 0 ? (
                      <li className="flex flex-col items-center gap-2 rounded-[20px] bg-[var(--card-bg)] p-8 text-center ring-1 ring-[var(--card-border)]">
                        <CheckCircle2 aria-hidden="true" className="size-8 text-emerald-500" />
                        <p className="text-sm font-semibold text-[var(--color-muted)]">
                          No hay solicitudes pendientes para tu equipo.
                        </p>
                      </li>
                    ) : null}
                    {pending.map((request) => (
                      <li className="relative" key={request.id}>
                        <PendingRequestCard
                          mount={markMountOnce()}
                          onClick={() => navigate(`/manager/requests/${request.id}`)}
                          onToggleSelect={toggleSelect}
                          request={request}
                          selected={selected.has(request.id)}
                        />
                        <span className="absolute right-16 top-4">
                          <AgingBadge request={request} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-5 flex flex-col gap-5" aria-label="Widgets de equipo">
                  <TopRequesters members={team} requests={absences} />
                </section>
              </>
            )}
            {!isLoading ? (
              <BulkActionsBar
                ids={Array.from(selected)}
                onComplete={() => {
                  clearSelection();
                  void loadAll();
                }}
                reviewerRole="manager"
              />
            ) : null}
          </div>

          {!isLoading && prefs.showAgenda ? (
            <aside className="flex flex-col gap-5">
              <section
                aria-labelledby="agenda-title"
                className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
              >
                <button
                  className="press mb-4 flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => navigate("/manager/calendar")}
                  type="button"
                >
                  <div>
                    <p className="text-sm font-black text-[var(--color-muted)]">Agenda</p>
                    <h2 className="mt-1 text-xl font-black" id="agenda-title">Próximas ausencias</h2>
                  </div>
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <CalendarDays aria-hidden="true" className="size-5" />
                  </span>
                </button>
                <ul className="stagger space-y-2">
                  {absences.length === 0 ? (
                    <li className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--card-muted)] p-8 text-center">
                      <CalendarDays aria-hidden="true" className="size-8 text-[var(--color-muted)]" />
                      <p className="text-sm font-semibold text-[var(--color-muted)]">Sin ausencias próximas.</p>
                    </li>
                  ) : null}
                  {absences.map((absence) => (
                    <AgendaItem
                      absence={absence}
                      key={absence.id}
                      mount={false}
                      onClick={() => absence.employee_id && navigate(`/manager/member/${absence.employee_id}`)}
                    />
                  ))}
                </ul>
              </section>

              <CoverageHeatmap absences={absences} members={team} />

              {prefs.showTeamWidget ? (
                <section
                  aria-labelledby="team-title"
                  className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
                >
                  <button
                    className="press mb-3 flex w-full items-center justify-between gap-2 text-left"
                    onClick={() => navigate("/manager/team")}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Users aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
                      <h2 className="font-black" id="team-title">Tu equipo</h2>
                    </div>
                    <span className="text-xs font-black text-[var(--color-muted)]">{team.length}</span>
                  </button>
                  <ul className="stagger space-y-2">
                    {team.length === 0 ? (
                      <li className="rounded-2xl bg-[var(--card-muted)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
                        Aún no tienes empleados asignados.
                      </li>
                    ) : null}
                    {team.map((member) => (
                      <TeamMemberRow
                        absentToday={absentEmployeeIds.has(member.id)}
                        key={member.id}
                        member={member}
                        mount={false}
                        onClick={() => navigate(`/manager/member/${member.id}`)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              <BirthdayStrip members={team} />
            </aside>
          ) : null}
        </section>
      </RefreshBoundary>
      <ManagerBottomNav />
    </main>
  );
}
