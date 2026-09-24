import { useCallback, useEffect, useState } from "react";

/** Qué muestra el Inicio de RH. Se guarda por dispositivo (localStorage),
 *  no se sincroniza entre navegadores ni con la nube. */
export type InicioPrefs = {
  /** Métrica "Ausentes hoy" en el riel del bloque de foco. */
  showAbsentToday: boolean;
  /** Métrica "Empleados activos" en el riel del bloque de foco. */
  showActiveEmployees: boolean;
  /** Sección de gráficos (tendencia + tipos de permiso). */
  showCharts: boolean;
  /** Sección "Movimientos de plantilla". */
  showMovements: boolean;
  /** Métrica "Vacaciones usadas" en el riel del bloque de foco. */
  showUtilization: boolean;
};

export const INICIO_PREFS_DEFAULTS: InicioPrefs = {
  showAbsentToday: true,
  showActiveEmployees: true,
  showCharts: true,
  showMovements: true,
  showUtilization: true,
};

export const INICIO_PREFS_STORAGE_KEY = "xignis.inicio.prefs.v1";

/** Puro: parsea raw JSON de localStorage y mergea con defaults. */
export function parseInicioPrefs(raw: string | null): InicioPrefs {
  if (!raw) return INICIO_PREFS_DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<InicioPrefs>;
    return { ...INICIO_PREFS_DEFAULTS, ...parsed };
  } catch {
    return INICIO_PREFS_DEFAULTS;
  }
}

function loadPrefs(): InicioPrefs {
  if (typeof window === "undefined") return INICIO_PREFS_DEFAULTS;
  try {
    return parseInicioPrefs(window.localStorage.getItem(INICIO_PREFS_STORAGE_KEY));
  } catch {
    return INICIO_PREFS_DEFAULTS;
  }
}

export function useInicioPrefs() {
  const [prefs, setPrefs] = useState<InicioPrefs>(loadPrefs);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(INICIO_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage lleno o bloqueado: silencioso, no rompe el dashboard */
    }
  }, [prefs]);

  const update = useCallback((changes: Partial<InicioPrefs>) => {
    setPrefs((current) => ({ ...current, ...changes }));
  }, []);

  return { prefs, update };
}
