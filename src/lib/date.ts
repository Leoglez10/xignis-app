// Helpers de fecha en español (Intl nativo). Reemplaza date-fns/format.
const dateFmt = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" });

function toDate(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date(iso) : d;
}

export function formatDateEs(iso: string): string {
  return dateFmt.format(toDate(iso)).replace(".", "");
}

export function formatDateRangeEs(start: string, end: string): string {
  return start === end ? formatDateEs(start) : `${formatDateEs(start)} – ${formatDateEs(end)}`;
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function startOfDay(iso: string): number {
  return toDate(iso).getTime();
}

export function overlapsToday(start: string, end: string, now: Date = new Date()): boolean {
  const t = startOfDay(todayIso(now));
  return startOfDay(start) <= t && startOfDay(end) >= t;
}

export function startsWithinDays(start: string, days: number, now: Date = new Date()): boolean {
  const t = startOfDay(todayIso(now));
  const startMs = startOfDay(start);
  return startMs >= t && startMs <= t + days * 86_400_000;
}

const MONTH_DAYS: ReadonlyArray<number> = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number) {
  return m === 1 && isLeap(y) ? 29 : MONTH_DAYS[m];
}

/** Genera cada día entre start y end (inclusive) como YYYY-MM-DD, sin alocation de Date. */
export function eachDayIso(start: string, end: string): string[] {
  const out: string[] = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7)) - 1;
  let d = Number(start.slice(8, 10));
  const endY = Number(end.slice(0, 4));
  const endM = Number(end.slice(5, 7)) - 1;
  const endD = Number(end.slice(8, 10));
  const key = () => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  let guard = 0;
  while ((y < endY || (y === endY && m < endM) || (y === endY && m === endM && d <= endD)) && guard < 400) {
    out.push(key());
    d += 1;
    const dim = daysInMonth(y, m);
    if (d > dim) {
      d = 1;
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    guard += 1;
  }
  return out;
}