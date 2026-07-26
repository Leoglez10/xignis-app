import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { monthCellsISO, shiftMonth, todayIso } from "../../lib/date";
import { tapHaptic } from "../../lib/haptics";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthNameFmt = new Intl.DateTimeFormat("es", { month: "long" });
const fullDayFmt = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" });
const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  monthNameFmt.format(new Date(2020, index, 1)).replace(/^./, (c) => c.toUpperCase()),
);
const YEARS_AHEAD = 3;

export type DateRange = { end: string; start: string };

/** Siguiente rango al tocar un día: 1er tap fija inicio, 2do fija fin. Tocar antes del
 *  inicio (o con el rango ya completo) reinicia la selección desde ese día. */
export function pickRange(current: DateRange, day: string): DateRange {
  if (!current.start || current.end || day < current.start) return { end: "", start: day };
  return { end: day, start: current.start };
}

/** Fin tentativo del rango: sólo con inicio elegido, sin fin, y apuntando a un día posterior. */
export function previewRangeEnd(current: DateRange, hovered: string | null): string {
  if (current.end || !current.start || !hovered || hovered <= current.start) return "";
  return hovered;
}

type DateRangeCalendarProps = {
  end: string;
  min?: string;
  onChange: (range: DateRange) => void;
  start: string;
};

export function DateRangeCalendar({ end, min = todayIso(), onChange, start }: DateRangeCalendarProps) {
  const anchor = start || todayIso();
  const [view, setView] = useState(() => ({ monthIndex: Number(anchor.slice(5, 7)) - 1, year: Number(anchor.slice(0, 4)) }));
  const [hovered, setHovered] = useState<string | null>(null);
  const cells = monthCellsISO(view.year, view.monthIndex);
  const firstYear = Math.min(Number(min.slice(0, 4)), Number(anchor.slice(0, 4)));
  // El año visible siempre está en la lista, aunque se haya llegado con las flechas.
  const years = [...new Set([...Array.from({ length: YEARS_AHEAD + 1 }, (_, index) => firstYear + index), view.year])].sort();
  // Sin efecto en móvil: ahí no hay hover.
  const previewEnd = previewRangeEnd({ end, start }, hovered);

  function select(day: string) {
    void tapHaptic();
    setHovered(null);
    onChange(pickRange({ end, start }, day));
  }

  return (
    <div className="rounded-2xl bg-[var(--card-bg)] p-3 ring-1 ring-[var(--card-border)]">
      <div className="mb-2 flex items-center justify-between">
        <button
          aria-label="Mes anterior"
          className="press grid size-9 place-items-center rounded-full bg-[var(--color-surface)]"
          type="button"
          onClick={() => setView((v) => shiftMonth(v.year, v.monthIndex, -1))}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <div className="flex items-center gap-1">
          <select
            aria-label="Mes"
            className="rounded-xl bg-[var(--color-surface)] px-2 py-1.5 text-sm font-bold text-[var(--color-text)]"
            value={view.monthIndex}
            onChange={(event) => setView((v) => ({ ...v, monthIndex: Number(event.target.value) }))}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>
          <select
            aria-label="Año"
            className="rounded-xl bg-[var(--color-surface)] px-2 py-1.5 text-sm font-bold text-[var(--color-text)]"
            value={view.year}
            onChange={(event) => setView((v) => ({ ...v, year: Number(event.target.value) }))}
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button
          aria-label="Mes siguiente"
          className="press grid size-9 place-items-center rounded-full bg-[var(--color-surface)]"
          type="button"
          onClick={() => setView((v) => shiftMonth(v.year, v.monthIndex, 1))}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((label, index) => (
          <span className="text-center text-[11px] font-bold text-[var(--color-muted)]" key={index}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" onMouseLeave={() => setHovered(null)}>
        {cells.map(({ iso, isInMonth }) => {
          const disabled = iso < min;
          const isStart = Boolean(start) && iso === start;
          const isEnd = Boolean(end) && iso === end;
          const rangeEnd = end || previewEnd;
          const inRange = Boolean(start && rangeEnd) && iso > start && iso < rangeEnd;
          const isPreviewEnd = Boolean(previewEnd) && iso === previewEnd;
          const edge = isStart || isEnd;

          return (
            <button
              aria-label={fullDayFmt.format(new Date(`${iso}T00:00:00`))}
              aria-pressed={edge || inRange}
              className={`press grid h-10 place-items-center rounded-xl text-sm transition ${
                edge
                  ? "bg-[var(--color-primary)] font-bold text-white"
                  : isPreviewEnd
                    ? "bg-emerald-200 font-bold text-emerald-900"
                    : inRange
                      ? "bg-emerald-100 font-semibold text-emerald-900"
                      : disabled
                        ? "cursor-not-allowed text-slate-300"
                        : isInMonth
                          ? "text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                          : "text-[var(--color-muted)] opacity-50 hover:bg-[var(--color-surface)]"
              }`}
              disabled={disabled}
              key={iso}
              type="button"
              onClick={() => select(iso)}
              onFocus={() => setHovered(iso)}
              onMouseEnter={() => setHovered(iso)}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
