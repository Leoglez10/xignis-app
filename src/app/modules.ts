import {
  BarChart3,
  CalendarDays,
  FileText,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../lib/database.types";
import { routeForRole } from "../features/auth/services/authService";

export type ModuleStatus = "live" | "soon";

export type XignisModule = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Ruta live, o ruta del placeholder coming-soon. */
  to: string;
};

/**
 * Fuente única de la plataforma Xignis. Hoy solo Vacaciones está live; el resto
 * son módulos "Próximamente" que alimentan el switcher y las rutas coming-soon.
 * La ruta de Vacaciones depende del rol (empleado/jefe/RH tienen inicios distintos).
 */
export function getModules(role: UserRole): XignisModule[] {
  return [
    {
      id: "vacaciones",
      name: "Vacaciones",
      description: "Permisos, ausencias y saldo de días.",
      icon: CalendarDays,
      status: "live",
      to: routeForRole(role),
    },
    {
      id: "gastos",
      name: "Control de gastos",
      description: "Registro y control de gastos.",
      icon: Receipt,
      status: "soon",
      to: "/gastos",
    },
    {
      id: "reportes",
      name: "Reportes",
      description: "Reportes y analíticas de la organización.",
      icon: BarChart3,
      status: "soon",
      to: "/reportes",
    },
    {
      id: "nomina",
      name: "Nómina",
      description: "Nómina y pagos del equipo.",
      icon: Wallet,
      status: "soon",
      to: "/nomina",
    },
    {
      id: "documentos",
      name: "Documentos",
      description: "Contratos y documentos del empleado.",
      icon: FileText,
      status: "soon",
      to: "/documentos",
    },
  ];
}

/** Descriptor por id, para la pantalla coming-soon genérica. */
export function getModuleById(role: UserRole, id: string) {
  return getModules(role).find((module) => module.id === id);
}
