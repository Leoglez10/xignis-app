import { Bell, Info, Palette, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

/** Raíz de la página "Cuenta": perfil y ajustes unificados para todos los roles. */
export const ACCOUNT_BASE = "/cuenta";

export type AccountSectionId = "perfil" | "apariencia" | "notificaciones" | "privacidad" | "acerca";

export type AccountSection = { id: AccountSectionId; label: string; icon: LucideIcon };

/** Orden del sub-nav interno (lista en escritorio, fila deslizable en móvil). */
export const accountSections: AccountSection[] = [
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "privacidad", label: "Privacidad", icon: ShieldCheck },
  { id: "acerca", label: "Acerca de", icon: Info },
];

export const DEFAULT_ACCOUNT_SECTION: AccountSectionId = "perfil";

export function accountPath(section: AccountSectionId = DEFAULT_ACCOUNT_SECTION): string {
  return `${ACCOUNT_BASE}/${section}`;
}

export function isAccountSection(value: string | undefined): value is AccountSectionId {
  return accountSections.some((section) => section.id === value);
}

/** ¿La ruta pertenece a la página "Cuenta"? (`/cuenta` o `/cuenta/<sección>`). */
export function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_BASE || pathname.startsWith(`${ACCOUNT_BASE}/`);
}

/** Rutas anteriores (perfil y ajustes separados) → su sección en "Cuenta".
 *  Se conservan como redirecciones para no romper deep links ni notificaciones. */
export const legacyAccountRedirects: Record<string, string> = {
  "/profile": accountPath("perfil"),
  "/settings": accountPath("apariencia"),
};
