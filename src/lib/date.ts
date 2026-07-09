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

/** Primer día del mes como ISO YYYY-MM-DD. */
export function startOfMonthISO(year: number, monthIndex: number): string {
  return `${year}-${pad2(monthIndex + 1)}-01`;
}

/** Último día del mes como ISO YYYY-MM-DD (sin Date allocation). */
export function endOfMonthISO(year: number, monthIndex: number): string {
  const dim = monthIndex === 1 && isLeap(year) ? 29 : MONTH_DAYS[monthIndex];
  return `${year}-${pad2(monthIndex + 1)}-${pad2(dim)}`;
}

/** Index del lunes=0..domingo=6 de un día ISO dado (lun-dom, ISO estándar). */
export function weekdayISO(iso: string): number {
  const d = toDate(iso);
  return (d.getUTCDay() + 6) % 7; // getUTCDay() es dom=0..sab=6 → convertir a lun=0..dom=6
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const MONTH_DAYS: ReadonlyArray<number> = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number) {
  return m === 1 && isLeap(y) ? 29 : MONTH_DAYS[m];
}

/** Días naturales entre dos ISO (inclusive). Cero si start > end. */
export function diffDaysInclusive(startISO: string, endISO: string): number {
  if (startISO > endISO) return 0;
  const start = new Date(`${startISO}T00:00:00`).getTime();
  const end = new Date(`${endISO}T00:00:00`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000) + 1);
}

/** Diferencia en días entre hoy y un ISO futuro (>=0 si hoy es igual o posterior).
 *  Negativo si el ISO ya pasó. */
export function daysFromToday(iso: string, now: Date = new Date()): number {
  const today = startOfDay(todayIso(now));
  const target = startOfDay(iso);
  return Math.round((target - today) / 86_400_000);
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
  const key = () => `${y}-${pad2(m + 1)}-${pad2(d)}`;
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