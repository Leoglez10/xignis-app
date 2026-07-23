import { AlertTriangle, ArrowRight, CalendarDays, ChevronRight, Inbox, UserX, Users } from "lucide-react";
import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { formatDateRangeEs, eachDayIso, overlapsToday } from "../../../lib/date";
import { roleLabel } from "../../profiles/services/profileService";
import { ManagerShell } from "../components/managerNav";
import { useAuth } from "../../session/AuthContext";
import { leaveTypeConfig } from "../../leave-requests/config";
import { useDashboardPrefs } from "../useDashboardPrefs";
import { AgendaItem } from "../components/AgendaItem";
import { AgingBadge } from "../../../components/ui/AgingBadge";
import { BirthdayStrip } from "../components/BirthdayStrip";
import { usePreferences } from "../../settings/PreferencesContext";
import { CoverageHeatmap } from "../components/CoverageHeatmap";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { RefreshBoundary } from "../components/RefreshBoundary";
import { TeamMemberRow } from "../components/TeamMemberRow";
import { useManagerPendingRequests } from "../hooks/useManagerPendingRequests";

export function ManagerDashboardScreen() {
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { prefs } = useDashboardPrefs();

  const { absences, error, isLoading, pending, refetch, team } = useManagerPendingRequests();

  const absentEmployeeIds = useMemo(
    () => new Set(absences.filter((a) => overlapsToday(a.start_date, a.end_date)).map((a) => a.employee_id)),
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

  // Top-3 most urgent pending requests. The service returns pending ordered by
  // created_at ascending, so the oldest (most aged) already come first.
  const topUrgent = useMemo(() => pending.slice(0, 3), [pending]);

  const managerFirstName = profile?.full_name.split(" ")[0] ?? "Jefe";
  const roleBadge = profile ? roleLabel[profile.role] : "Jefe";

  const shortcuts = [
    { count: pending.length, icon: Inbox, label: "Solicitudes pendientes", to: "/manager/requests", tone: "bg-[var(--stat-pending)] text-[var(--stat-pending-text)]" },
    { count: absentEmployeeIds.size, icon: UserX, label: "Ausentes hoy", to: "/manager/calendar", tone: "bg-[var(--stat-absent)] text-[var(--stat-absent-text)]" },
    { count: team.length, icon: Users, label: "Equipo", to: "/manager/team", tone: "bg-[var(--stat-upcoming)] text-[var(--stat-upcoming-text)]" },
  ];

  return (
    <ManagerShell>
      <RefreshBoundary onRefresh={refetch}>
        <section className="grid min-h-dvh gap-5 p-4 pb-24 pt-4 md:p-6 md:pb-24 lg:grid-cols-[1fr_var(--aside-width)]">
          <div className="min-w-0 bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6">
            <header className="animate-fade-up mb-6">
              <p className="text-sm font-bold text-[var(--color-muted)]">{roleBadge}</p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">{managerFirstName}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {isLoading
                  ? "Cargando…"
                  : agedCount > 0
                    ? `${pending.length} pendientes · ${agedCount} con más de 48 h`
                    : `${pending.length} solicitudes pendientes`}
              </p>
            </header>

            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <section
                  className="animate-fade-up stagger mb-5 grid grid-cols-3 gap-3"
                  aria-label="Accesos directos"
                >
                  {shortcuts.map(({ count, icon: Icon, label, to, tone }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className="press flex flex-col gap-2 rounded-[20px] bg-[var(--card-muted)] p-4 ring-1 ring-[var(--card-border)]"
                    >
                      <span className={`grid size-9 place-items-center rounded-2xl ${tone}`}>
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="text-2xl font-bold leading-none">{count}</span>
                      <span className="text-xs font-bold text-[var(--color-muted)]">{label}</span>
                    </NavLink>
                  ))}
                </section>

                {agedCount > 0 ? (
                  <div className="animate-fade-up mb-5 flex gap-3 rounded-2xl bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{agedCount} solicitud{agedCount === 1 ? "" : "es"} con más de 48 h</p>
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

                <section className="rounded-[24px] bg-[var(--card-muted)] p-4" aria-labelledby="manager-urgent-title">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold md:text-xl" id="manager-urgent-title">
                      Próximas 3 urgentes
                    </h2>
                    <NavLink
                      to="/manager/requests"
                      className="press inline-flex items-center gap-1 text-xs font-bold text-[var(--color-muted)]"
                    >
                      Ver todas ({pending.length})
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </NavLink>
                  </div>

                  {topUrgent.length === 0 ? (
                    <p className="rounded-[20px] bg-[var(--card-bg)] p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-[var(--card-border)]">
                      No hay solicitudes pendientes para tu equipo.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {topUrgent.map((request) => (
                        <li key={request.id}>
                          <button
                            className="press flex w-full items-center gap-3 rounded-[20px] bg-[var(--card-bg)] p-3 text-left ring-1 ring-[var(--card-border)]"
                            type="button"
                            onClick={() => navigate(`/manager/requests/${request.id}`)}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">
                                {request.employee?.full_name ?? "Empleado"}
                              </span>
                              <span className="block truncate text-xs text-[var(--color-muted)]">
                                {leaveTypeConfig[request.leave_type].label}
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
              </>
            )}
          </div>

          {!isLoading && prefs.showAgenda ? (
            <aside className="flex flex-col gap-5">
              <section
                aria-labelledby="agenda-title"
                className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
              >
                <button
                  className="press mb-4 flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => navigate("/manager/calendar")}
                  type="button"
                >
                  <div>
                    <p className="text-sm font-bold text-[var(--color-muted)]">Agenda</p>
                    <h2 className="mt-1 text-xl font-bold" id="agenda-title">Próximas ausencias</h2>
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
                  className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
                >
                  <button
                    className="press mb-3 flex w-full items-center justify-between gap-2 text-left"
                    onClick={() => navigate("/manager/team")}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Users aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
                      <h2 className="font-bold" id="team-title">Tu equipo</h2>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-muted)]">{team.length}</span>
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

              {preferences.birthdayVisibility ? <BirthdayStrip members={team} /> : null}
            </aside>
          ) : null}
        </section>
      </RefreshBoundary>
    </ManagerShell>
  );
}
