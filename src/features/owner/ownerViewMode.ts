import { useSyncExternalStore } from "react";

/** Vista del dueño con reportes directos: toda la empresa + su equipo ("owner")
 *  o solo su equipo ("team"). Preferencia por dispositivo. */
export type OwnerViewMode = "owner" | "team";

const STORAGE_KEY = "xignis.owner-view:v1";
const listeners = new Set<() => void>();

function read(): OwnerViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "team" ? "team" : "owner";
  } catch {
    return "owner";
  }
}

let current: OwnerViewMode = read();

export function getOwnerViewMode(): OwnerViewMode {
  return current;
}

export function setOwnerViewMode(mode: OwnerViewMode) {
  current = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Almacenamiento no disponible (modo privado): la vista dura la sesión.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Modo de vista compartido por TopBar, Sidebar, swipes y rutas. */
export function useOwnerViewMode(): [OwnerViewMode, (mode: OwnerViewMode) => void] {
  const mode = useSyncExternalStore(subscribe, getOwnerViewMode, getOwnerViewMode);
  return [mode, setOwnerViewMode];
}
