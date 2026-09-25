import { AlertTriangle, ArrowRight, CalendarDays, Inbox, UserX, Users } from "lucide-react";
import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { eachDayIso, formatDateRangeEs, overlapsToday } from "../../../lib/date";
import { useManagerPendingRequests } from "../hooks/useManagerPendingRequests";
import { AgendaItem } from "./AgendaItem";
import { TeamMemberRow } from "./TeamMemberRow";
import { UrgentRequestItem } from "./UrgentRequestItem";

/**
 * Secciones del inicio de jefe, compartidas por el dashboard de jefe (/manager)
 * y el inicio combinado del dueño con reportes directos (/owner).
 */

type TeamData = ReturnType<typeof useManagerPendingRequests>;
type Absence = TeamData["absences"][number];
type Member = TeamData["team"][number];
type Pending = TeamData["pending"];

/** Datos del equipo del jefe + métricas derivadas (ausentes hoy, >48 h, top 3). */
export function useTeamOverview() {
  const data = useManagerPendingRequests();
  const { absences, pending } = data;

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

  // The service returns pending ordered by created_at ascending, so the oldest
  // (most aged) already come first.
  const topUrgent = useMemo(() => pending.slice(0, 3), [pending]);

  return { ...data, absentEmployeeIds, agedCount, overlapAlert, topUrgent };
}

/** KPIs: Solicitudes pendientes, Ausentes hoy, Equipo. */
export function TeamShortcuts({ absentToday, pendingCount, teamCount }: { absentToday: number; pendingCount: number; teamCount: number }) {
  const shortcuts = [
    { count: pendingCount, icon: Inbox, label: "Solicitudes pendientes", to: "/manager/requests", tone: "bg-[var(--stat-pending)] text-[var(--stat-pending-text)]" },
    { count: absentToday, icon: UserX, label: "Ausentes hoy", to: "/manager/calendar", tone: "bg-[var(--stat-absent)] text-[var(--stat-absent-text)]" },
    { count: teamCount, icon: Users, label: "Equipo", to: "/manager/team", tone: "bg-[var(--stat-upcoming)] text-[var(--stat-upcoming-text)]" },
  ];
  return (
    <section className="animate-fade-up stagger mb-5 grid grid-cols-3 gap-3" aria-label="Accesos directos">
      {shortcuts.map(({ count, icon: Icon, label, to, tone }) => (
        <NavLink key={to} to={to} className="press flex flex-col gap-2 rounded-[20px] bg-[var(--card-muted)] p-4 ring-1 ring-[var(--card-border)]">
          <span className={`grid size-9 place-items-center rounded-2xl ${tone}`}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span className="text-2xl font-bold leading-none">{count}</span>
          <span className="text-xs font-bold text-[var(--color-muted)]">{label}</span>
        </NavLink>
      ))}
    </section>
  );
}

/** Alertas: solicitudes con más de 48 h y días con varias ausencias. */
export function TeamAlerts({ agedCount, overlapAlert }: { agedCount: number; overlapAlert: { count: number; date: string } | null }) {
  return (
    <>
      {agedCount > 0 ? (
        <div className="animate-fade-up mb-5 flex gap-3 rounded-2xl bg-rose-50 p-4 text-rose-900 ring-1 ring-rose-200">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{agedCount} solicitud{agedCount === 1 ? "" : "es"} con más de 48 h</p>
            <p className="mt-0.5 text-xs text-rose-800/80">Revisa las más antiguas para mantener el SLA de tu equipo.</p>
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
    </>
  );
}

/** "Próximas 3 urgentes" con Aprobar/Rechazar en línea. */
export function UrgentRequestsSection({ onReview, pendingCount, topUrgent }: { onReview: TeamData["reviewRequest"]; pendingCount: number; topUrgent: Pending }) {
  const navigate = useNavigate();
  return (
    <section className="rounded-[24px] bg-[var(--card-muted)] p-4" aria-labelledby="manager-urgent-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold md:text-xl" id="manager-urgent-title">
          Próximas 3 urgentes
        </h2>
        <NavLink to="/manager/requests" className="press inline-flex items-center gap-1 text-xs font-bold text-[var(--color-muted)]">
          Ver todas ({pendingCount})
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
            <UrgentRequestItem key={request.id} onDetail={() => navigate(`/manager/requests/${request.id}`)} onReview={onReview} request={request} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Tarjeta "Próximas ausencias" del equipo. */
export function UpcomingAbsencesCard({ absences }: { absences: Absence[] }) {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="agenda-title" className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6">
      <button className="press mb-4 flex w-full items-start justify-between gap-4 text-left" onClick={() => navigate("/manager/calendar")} type="button">
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
  );
}

/** Tarjeta "Tu equipo" con cada integrante y si está ausente hoy. */
export function TeamMembersCard({ absentEmployeeIds, team }: { absentEmployeeIds: Set<string | null>; team: Member[] }) {
  const navigate = useNavigate();
  return (
    <section aria-labelledby="team-title" className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6">
      <button className="press mb-3 flex w-full items-center justify-between gap-2 text-left" onClick={() => navigate("/manager/team")} type="button">
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
  );
}
