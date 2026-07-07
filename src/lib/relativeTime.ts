// Tiempo relativo en español con Intl nativo. Reemplaza date-fns/formatDistanceToNow.
const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

/** "hace 2 horas" / "dentro de 5 minutos". Negativo (pasado) → prefijo "hace". */
export function relativeTimeEs(from: Date | string, now: Date = new Date()): string {
  const diffSec = (new Date(from).getTime() - now.getTime()) / 1000;
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diffSec) >= secs || unit === "second") {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  return rtf.format(0, "second"); // inalcanzable; satisface el tipo de retorno
}
