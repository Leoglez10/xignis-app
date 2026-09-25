import { ArrowRight, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { initials } from "../../../lib/avatar";
import { eachDayIso, monthCellsISO, shiftMonth, todayIso } from "../../../lib/date";
import { leaveTypeConfig } from "../../leave-requests/config";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import type { Profile } from "../../../lib/database.types";
import {
  absentByDate,
  coverageDay,
  coverageLevel,
  mergeAbsences,
  WEEKDAY_SHORT,
  type CoverageLevel,
} from "../coverage";
import { useTeamAbsencesInRange } from "../hooks/useTeamAbsencesInRange";

type CoverageHeatmapProps = {
  members: Profile[];
  /** Ausencias aprobadas próximas (del dashboard); el mes visible se completa con la Agenda. */
  absences: LeaveRequestWithEmployee[];
  days?: number;
};

const monthFmt = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });

// Present-ratio → chip tone for the header pill. Green = fully covered, rose = understaffed.
function tone(ratio: number) {
  if (ratio >= 1) return "bg-emerald-100 text-emerald-800";
  if (ratio >= 0.8) return "bg-lime-100 text-lime-800";
  if (ratio >= 0.6) return "bg-amber-100 text-amber-800";
  if (ratio >= 0.4) return "bg-orange-100 text-orange-900";
  return "bg-rose-100 text-rose-800";
}

const LEVEL_DOT: Record<CoverageLevel, string> = {
  full: "bg-emerald-500",
  low: "bg-rose-500",
  partial: "bg-amber-400",
};

const controlClass =
  "press grid size-8 place-items-center rounded-full bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]";

export function CoverageHeatmap({ members, absences, days = 14 }: CoverageHeatmapProps) {
  const today = todayIso();
  const [view, setView] = useState(() => ({ monthIndex: Number(today.slice(5, 7)) - 1, year: Number(today.slice(0, 4)) }));
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const cells = useMemo(() => monthCellsISO(view.year, view.monthIndex), [view]);
  const memberIds = useMemo(() => members.map((m) => m.id), [members]);
  const monthAbsences = useTeamAbsencesInRange(cells[0].iso, cells[cells.length - 1].iso, memberIds);

  const byDate = useMemo(
    () => absentByDate(members, mergeAbsences(absences, monthAbsences)),
    [members, absences, monthAbsences],
  );
  const total = members.length;

  // Default focus = the most understaffed upcoming day (that's the one worth acting on).
  const upcoming = useMemo(() => {
    const end = new Date(`${today}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + days - 1);
    return eachDayIso(today, end.toISOString().slice(0, 10)).map((iso) => coverageDay(iso, total, byDate));
  }, [today, days, total, byDate]);
  const worst = upcoming.reduce((w, d) => (d.ratio < w.ratio ? d : w), upcoming[0]);
  const selected = selectedIso ? coverageDay(selectedIso, total, byDate) : worst;

  if (members.length === 0) {
    return (
      <section
        aria-label="Cobertura del equipo"
        className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
      >
        <h2 className="font-bold">Cobertura del equipo</h2>
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-[var(--card-muted)] p-8 text-center">
          <Users aria-hidden="true" className="size-8 text-[var(--color-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-muted)]">
            Aún no tienes equipo asignado.
          </p>
        </div>
      </section>
    );
  }

  const anyAbsence = upcoming.some((d) => d.absent.length > 0);
  const monthLabel = monthFmt.format(new Date(view.year, view.monthIndex, 1)).replace(/^./, (c) => c.toUpperCase());
  const goMonth = (delta: number) => setView((v) => shiftMonth(v.year, v.monthIndex, delta));
  const goToday = () => {
    setView({ monthIndex: Number(today.slice(5, 7)) - 1, year: Number(today.slice(0, 4)) });
    setSelectedIso(today);
  };

  return (
    <section
      aria-label="Cobertura del equipo"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Cobertura del equipo</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Próximos {days} días · {total} personas
          </p>
        </div>
        {anyAbsence ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${tone(worst.ratio)}`}>
            Día más ajustado: {worst.present}/{total}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Equipo completo ✓
          </span>
        )}
      </div>

      {/* Month controls, same pattern as the Agenda screen. */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm font-bold">{monthLabel}</p>
        <div className="flex items-center gap-1.5">
          <button aria-label="Mes anterior" className={controlClass} onClick={() => goMonth(-1)} type="button">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            className="press h-8 rounded-full bg-[var(--card-bg)] px-3 text-xs font-bold text-[var(--color-muted)] ring-1 ring-[var(--card-border)]"
            onClick={goToday}
            type="button"
          >
            Hoy
          </button>
          <button aria-label="Mes siguiente" className={controlClass} onClick={() => goMonth(1)} type="button">
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      {/* Mini month calendar — tap a day to see who's out. */}
      <div className="grid grid-cols-7 gap-0.5" role="group" aria-label={`Cobertura de ${monthLabel}`}>
        {WEEKDAY_SHORT.map((d) => (
          <span aria-hidden="true" className="pb-1 text-center text-[10px] font-bold text-[var(--color-muted)]" key={d}>
            {d}
          </span>
        ))}
        {cells.map(({ iso, isInMonth }) => {
          const d = coverageDay(iso, total, byDate);
          const level = coverageLevel(d.ratio);
          const isSel = iso === selected.iso;
          const isToday = iso === today;
          return (
            <button
              aria-label={`${d.weekday} ${d.dayNum}: ${d.present} de ${total} disponibles`}
              aria-pressed={isSel}
              className={`press flex h-9 min-w-8 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-bold transition ${
                isInMonth ? "" : "opacity-40"
              } ${
                isSel
                  ? "bg-[var(--card-muted)] ring-2 ring-emerald-500"
                  : isToday
                    ? "ring-2 ring-[var(--color-primary)]"
                    : "hover:bg-[var(--card-muted)]"
              } ${isToday ? "text-[var(--color-primary)]" : ""}`}
              data-coverage={isInMonth ? level : undefined}
              key={iso}
              onClick={() => setSelectedIso(iso)}
              type="button"
            >
              <span className="leading-none">{d.dayNum}</span>
              <span className={`size-1.5 rounded-full ${isInMonth ? LEVEL_DOT[level] : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      {/* Detail for the selected day. */}
      <div className="mt-4 border-t border-[var(--card-border)] pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold capitalize">
            {selected.weekday} {selected.dayNum}
          </p>
          <span className="text-xs font-bold text-[var(--color-muted)]">
            {selected.present} de {total} disponibles
          </span>
        </div>
        {selected.absent.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-3 text-center text-sm font-semibold text-emerald-700">
            Todo el equipo disponible este día.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selected.absent.map((a) => {
              const cfg = leaveTypeConfig[a.leaveType];
              return (
                <li className="flex items-center gap-2.5" key={a.id}>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${cfg.avatarTone}`}>
                    {initials(a.name)}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold">{a.name}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg.chipTone}`}>
                    {cfg.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NavLink
        className="press mt-3 flex items-center justify-end gap-1 text-xs font-bold text-[var(--color-muted)]"
        to="/manager/calendar"
      >
        Ver agenda
        <ArrowRight aria-hidden="true" className="size-4" />
      </NavLink>
    </section>
  );
}
