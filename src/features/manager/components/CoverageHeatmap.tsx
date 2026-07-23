import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { initials } from "../../../lib/avatar";
import { eachDayIso, todayIso } from "../../../lib/date";
import { leaveTypeConfig } from "../../leave-requests/config";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import type { LeaveType, Profile } from "../../../lib/database.types";

type CoverageHeatmapProps = {
  members: Profile[];
  absences: LeaveRequestWithEmployee[];
  days?: number;
};

type AbsentEntry = { id: string; name: string; leaveType: LeaveType };
type DayInfo = {
  iso: string;
  weekday: string;
  dayNum: number;
  present: number;
  absent: AbsentEntry[];
  ratio: number;
};

const WEEKDAY = ["L", "M", "X", "J", "V", "S", "D"];

// Present-ratio → visual tone. Green = fully covered, rose = understaffed.
function tone(ratio: number) {
  if (ratio >= 1) return { bar: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800", label: "Completo" };
  if (ratio >= 0.8) return { bar: "bg-lime-400", chip: "bg-lime-100 text-lime-800", label: "Buena" };
  if (ratio >= 0.6) return { bar: "bg-amber-400", chip: "bg-amber-100 text-amber-800", label: "Ajustada" };
  if (ratio >= 0.4) return { bar: "bg-orange-400", chip: "bg-orange-100 text-orange-900", label: "Baja" };
  return { bar: "bg-rose-400", chip: "bg-rose-100 text-rose-800", label: "Crítica" };
}

export function CoverageHeatmap({ members, absences, days = 14 }: CoverageHeatmapProps) {
  const start = todayIso();

  const dayInfos = useMemo<DayInfo[]>(() => {
    const nameById = new Map(members.map((m) => [m.id, m.full_name]));
    const startDate = new Date(`${start}T00:00:00`);

    // date → list of absent members that day
    const absentByDate = new Map<string, AbsentEntry[]>();
    for (const a of absences) {
      if (!a.employee_id) continue;
      const name = nameById.get(a.employee_id) ?? a.employee?.full_name ?? "—";
      for (const iso of eachDayIso(a.start_date, a.end_date)) {
        if (iso < start) continue;
        const list = absentByDate.get(iso) ?? [];
        if (!list.some((e) => e.id === a.employee_id)) {
          list.push({ id: a.employee_id, name, leaveType: a.leave_type });
        }
        absentByDate.set(iso, list);
      }
    }

    const total = members.length || 1;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const absent = absentByDate.get(iso) ?? [];
      const present = Math.max(0, members.length - absent.length);
      return {
        iso,
        weekday: WEEKDAY[(d.getDay() + 6) % 7],
        dayNum: d.getDate(),
        present,
        absent,
        ratio: present / total,
      };
    });
  }, [members, absences, days, start]);

  // Default focus = the most understaffed upcoming day (that's the one worth acting on).
  const worst = useMemo(
    () => dayInfos.reduce((w, d) => (d.ratio < w.ratio ? d : w), dayInfos[0]),
    [dayInfos],
  );
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const selected = dayInfos.find((d) => d.iso === selectedIso) ?? worst;

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

  const total = members.length;
  const anyAbsence = dayInfos.some((d) => d.absent.length > 0);
  const worstTone = tone(worst.ratio);

  return (
    <section
      aria-label="Cobertura del equipo"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Cobertura del equipo</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Próximos <span className="md:hidden">7</span><span className="hidden md:inline">{days}</span> días · {total} personas
          </p>
        </div>
        {anyAbsence ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${worstTone.chip}`}>
            Día más ajustado: {worst.present}/{total}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Equipo completo ✓
          </span>
        )}
      </div>

      {/* Interactive day strip — tap a day to see who's out. */}
      <div className="grid grid-cols-7 gap-1.5 md:grid-cols-14">
        {dayInfos.map((d, i) => {
          const t = tone(d.ratio);
          const isSel = d.iso === selected.iso;
          const isToday = d.iso === start;
          return (
            <button
              aria-label={`${d.weekday} ${d.dayNum}: ${d.present} de ${total} disponibles`}
              aria-pressed={isSel}
              className={`press flex flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                i >= 7 ? "hidden md:flex" : ""
              } ${isSel ? "bg-[var(--card-muted)] ring-2 ring-emerald-500" : "hover:bg-[var(--card-muted)]"}`}
              key={d.iso}
              onClick={() => setSelectedIso(d.iso)}
              type="button"
            >
              <span className={`text-[10px] font-bold ${isToday ? "text-emerald-600" : "text-[var(--color-muted)]"}`}>
                {d.weekday}
              </span>
              <span className="text-xs font-bold">{d.dayNum}</span>
              <span className="flex h-10 w-2.5 items-end overflow-hidden rounded-full bg-[var(--card-muted)]">
                <span
                  className={`w-full rounded-full ${t.bar}`}
                  style={{ height: `${Math.max(8, d.ratio * 100)}%` }}
                />
              </span>
              <span className={`min-h-4 text-[10px] font-bold ${d.absent.length ? "text-rose-500" : "text-transparent"}`}>
                {d.absent.length ? `−${d.absent.length}` : "·"}
              </span>
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
    </section>
  );
}
