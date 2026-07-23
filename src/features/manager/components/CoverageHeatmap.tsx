import { initials } from "../../../lib/avatar";
import { eachDayIso, todayIso } from "../../../lib/date";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import type { Profile } from "../../../lib/database.types";

type CoverageHeatmapProps = {
  members: Profile[];
  absences: LeaveRequestWithEmployee[];
  days?: number;
};

const WEEKDAY = ["L", "M", "X", "J", "V", "S", "D"];

export function CoverageHeatmap({ members, absences, days = 14 }: CoverageHeatmapProps) {
  if (members.length === 0) return null;
  const start = todayIso();
  const startDate = new Date(`${start}T00:00:00`);
  const dateList: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dateList.push(d.toISOString().slice(0, 10));
  }

  const coverageByDate = new Map<string, number>();
  for (const a of absences) {
    for (const iso of eachDayIso(a.start_date, a.end_date)) {
      if (iso < start) continue;
      coverageByDate.set(iso, (coverageByDate.get(iso) ?? 0) + 1);
    }
  }

  function tone(count: number, total: number) {
    if (count === 0) return "bg-emerald-100 text-emerald-800";
    const ratio = count / total;
    if (ratio < 0.2) return "bg-emerald-200 text-emerald-900";
    if (ratio < 0.5) return "bg-amber-200 text-amber-900";
    if (ratio < 0.8) return "bg-orange-300 text-orange-900";
    return "bg-rose-400 text-white";
  }

  return (
    <section
      aria-label="Mapa de cobertura proxima"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold">
          Cobertura <span className="md:hidden">7 días</span><span className="hidden md:inline">{days} días</span>
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          Verde = disponible · Rojo = alta ausencia
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-[11px]">
          <thead>
            <tr>
              <th className="w-20 px-1 py-1 text-left font-bold text-[var(--color-muted)]">Persona</th>
              {dateList.map((iso, i) => {
                const d = new Date(`${iso}T00:00:00`);
                return (
                  <th
                    className={`px-1 py-1 text-center font-bold text-[var(--color-muted)] ${i >= 7 ? "hidden md:table-cell" : ""}`}
                    key={iso}
                    title={iso}
                  >
                    <div className="flex flex-col items-center">
                      <span>{WEEKDAY[(d.getDay() + 6) % 7]}</span>
                      <span className="text-[9px]">{d.getDate()}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const memberAbsences = absences.filter((a) => a.employee_id === m.id);
              const set = new Set<string>();
              for (const a of memberAbsences) {
                for (const iso of eachDayIso(a.start_date, a.end_date)) {
                  if (iso >= start) set.add(iso);
                }
              }
              return (
                <tr key={m.id}>
                  <td className="px-1 py-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700">
                        {initials(m.full_name)}
                      </span>
                      <span className="truncate text-xs font-bold">{m.full_name.split(" ")[0]}</span>
                    </div>
                  </td>
                  {dateList.map((iso, i) => {
                    const isAbsent = set.has(iso);
                    return (
                      <td className={`px-0.5 py-0.5 ${i >= 7 ? "hidden md:table-cell" : ""}`} key={iso}>
                        <span
                          aria-label={isAbsent ? `Ausente el ${iso}` : `Disponible el ${iso}`}
                          className={`block size-full min-h-5 rounded-md text-center text-[9px] font-bold leading-5 ${
                            isAbsent ? "bg-rose-300 text-rose-900" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isAbsent ? "✕" : "•"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
          <span>Cobertura global por día:</span>
          <div className="flex flex-wrap gap-1">
            {dateList.map((iso) => {
              const count = coverageByDate.get(iso) ?? 0;
              return (
                <span
                  aria-label={`${iso}: ${count} ausencias`}
                  className={`grid size-5 place-items-center rounded font-bold ${tone(count, members.length)}`}
                  key={iso}
                  title={`${iso} · ${count} ausencias`}
                >
                  {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
