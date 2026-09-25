/**
 * Clases de las pastillas de filtro/sección de la app (p. ej. "Pendientes |
 * Aprobadas | Rechazadas | Todas" en Solicitudes de RH): activa = pastilla
 * oscura con texto blanco; inactiva = superficie con borde. En dark mode,
 * `bg-white` y `ring-slate-200` se remapean en globals.css.
 */
export function pillTabClass(selected: boolean) {
  return `press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
    selected ? "bg-slate-950 text-white" : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
  }`;
}
