import { useCallback, useEffect, useState } from "react";

export type DashboardPrefs = {
  /** Colapsar la agenda (aside) en desktop. */
  agendaCollapsed: boolean;
  /** Mostrar u ocultar la sección "Próximas ausencias". */
  showAgenda: boolean;
  /** Mostrar u ocultar la sección "Tu equipo" en el aside. */
  showTeamWidget: boolean;
};

export const DASHBOARD_PREFS_DEFAULTS: DashboardPrefs = {
  agendaCollapsed: false,
  showAgenda: true,
  showTeamWidget: true,
};

export const DASHBOARD_PREFS_STORAGE_KEY = "xignis.dashboard.prefs.v1";

/** Puro: parsea raw JSON de localStorage y mergea con defaults. */
export function parsePrefs(raw: string | null): DashboardPrefs {
  if (!raw) return DASHBOARD_PREFS_DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<DashboardPrefs>;
    return { ...DASHBOARD_PREFS_DEFAULTS, ...parsed };
  } catch {
    return DASHBOARD_PREFS_DEFAULTS;
  }
}

function loadPrefs(): DashboardPrefs {
  if (typeof window === "undefined") return DASHBOARD_PREFS_DEFAULTS;
  try {
    return parsePrefs(window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY));
  } catch {
    return DASHBOARD_PREFS_DEFAULTS;
  }
}

/** Preferencias del dashboard persistentes por usuario en el dispositivo.
 *  No sincroniza entre dispositivos (es localStorage, no la nube). */
export function useDashboardPrefs() {
  const [prefs, setPrefs] = useState<DashboardPrefs>(loadPrefs);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DASHBOARD_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage lleno o bloqueado: silencioso, no rompe el dashboard */
    }
  }, [prefs]);

  const update = useCallback((changes: Partial<DashboardPrefs>) => {
    setPrefs((current) => ({ ...current, ...changes }));
  }, []);

  return { prefs, update };
}