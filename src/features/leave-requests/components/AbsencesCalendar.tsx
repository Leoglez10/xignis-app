import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import {
  eachDayIso,
  endOfMonthISO,
  startOfMonthISO,
  todayIso,
  weekdayISO,
} from "../../../lib/date";
import {
  listTeamAbsencesInRange,
  type LeaveRequestWithEmployee,
} from "../services/leaveRequestService";
import { AbsenceListItem } from "./AbsenceListItem";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthFmt = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" });

function eachCellISO(year: number, month: number): { iso: string; isInMonth: boolean }[] {
  const first = startOfMonthISO(year, month);
  const last = endOfMonthISO(year, month);
  const leading = weekdayISO(first);
  const TOTAL = 42;

  let prevY = year, prevM = month;
  if (prevM === 0) { prevY -= 1; prevM = 11; } else { prevM -= 1; }
  const prevAll = eachDayIso(startOfMonthISO(prevY, prevM), endOfMonthISO(prevY, prevM));
  const prevPad = prevAll.slice(prevAll.length - leading);

  let nextY = year, nextM = month;
  if (nextM === 11) { nextY += 1; nextM = 0; } else { nextM += 1; }
  const nextAll = eachDayIso(startOfMonthISO(nextY, nextM), endOfMonthISO(nextY, nextM));

  const cells: { iso: string; isInMonth: boolean }[] = [];
  for (const iso of prevPad) cells.push({ iso, isInMonth: false });
  for (const iso of eachDayIso(first, last)) cells.push({ iso, isInMonth: true });
  let i = 0;
  while (cells.length < TOTAL) {
    cells.push({ iso: nextAll[i] ?? nextAll[0], isInMonth: false });
    i++;
  }
  return cells;
}

export function AbsencesCalendar() {
  const navigate = useNavigate();
  const today = todayIso();
  const todayDate = new Date();
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [absences, setAbsences] = useState<LeaveRequestWithEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listTeamAbsencesInRange(startOfMonthISO(year, month), endOfMonthISO(year, month));
      setAbsences(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el calendario.");
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => { void load(); }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, LeaveRequestWithEmployee[]>();
    for (const a of absences) {
      for (const iso of eachDayIso(a.start_date, a.end_date)) {
        const list = map.get(iso) ?? [];
        list.push(a);
        map.set(iso, list);
      }
    }
    return map;
  }, [absences]);

  const cells = useMemo(() => eachCellISO(year, month), [year, month]);
  const selectedDayAbsences = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  const monthLabel = monthFmt.format(new Date(year, month, 1)).replace(/^./, (c) => c.toUpperCase());

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else { setMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else { setMonth((m) => m + 1); }
  }
  function goToday() {
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
  }

return (
      <>
      <div className="page-wrap pb-24 pt-5">
        <header className="animate-fade-up mb-5 flex items-center gap-3">
          <button
            aria-label="Regresar al panel"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/manager")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-muted)]">Agenda</p>
            <h2 className="text-2xl font-bold md:text-3xl">{monthLabel}</h2>
          </div>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 md:justify-end">
          <button
            aria-label="Mes anterior"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={prevMonth}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            className="press rounded-full bg-white px-4 py-2 text-xs font-bold text-[var(--color-muted)] ring-1 ring-slate-200"
            type="button"
            onClick={goToday}
          >
            Hoy
          </button>
          <button
            aria-label="Mes siguiente"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={nextMonth}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
            Cargando ausencias…
          </p>
        ) : (
          <section className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 md:p-4">
            {absences.length === 0 ? (
              <p className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--card-muted)] p-2 text-xs font-semibold text-[var(--color-muted)]">
                <CalendarDays aria-hidden="true" className="size-4" />
                Sin ausencias aprobadas en {monthLabel}.
              </p>
            ) : null}
            <div className="mb-2 grid grid-cols-7 gap-1 md:gap-2">
              {WEEKDAYS.map((d) => (
                <div className="text-center text-[11px] font-bold uppercase text-[var(--color-muted)]" key={d}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {cells.map((cell) => (
                <DayCell
                  absences={byDay.get(cell.iso) ?? []}
                  day={cell.iso}
                  isInMonth={cell.isInMonth}
                  isSelected={cell.iso === selectedDay}
                  isToday={cell.iso === today}
                  key={cell.iso}
                  onClick={setSelectedDay}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomSheet
        isOpen={Boolean(selectedDay)}
        title={selectedDay ? dayFmt.format(new Date(`${selectedDay}T00:00:00`)).replace(/^./, (c) => c.toUpperCase()) : "Ausencias"}
        onClose={() => setSelectedDay(null)}
      >
        <ul className="stagger space-y-2">
          {selectedDayAbsences.length === 0 ? (
            <li className="rounded-2xl bg-[var(--color-surface)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
              Nadie ausente este día.
            </li>
          ) : null}
          {selectedDayAbsences.map((a) => (
            <AbsenceListItem absence={a} key={a.id} />
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
