import { Search, Grid2x2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { useAuth } from "../features/session/AuthContext";
import { useScrollDirection } from "../lib/useScrollDirection";
import { tabsByRole, titleForPath } from "../app/navConfig";
import { ModuleSwitcherSheet } from "./ModuleSwitcherSheet";
import { initials } from "../lib/avatar";

/**
 * Header de la plataforma Xignis (estilo referencia): avatar + título + búsqueda
 * + notificaciones + switcher de módulos, pills de contexto y barra de tabs.
 * Fijo en pantallas autenticadas; se oculta al bajar. El offset del contenido
 * lo maneja `--topbar-content-h` más el safe area en globals.css.
 */
export function TopBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const hidden = useScrollDirection();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const role = profile?.role;
  const tabs = role ? tabsByRole[role] : [];
  const fallbackTitle = role ? titleForPath(role, pathname) : "Inicio";
  const [pageTitle, setPageTitle] = useState<string | null>(null);

  useEffect(() => {
    const main = document.getElementById("main-content");
    setPageTitle(main?.getAttribute("data-page-title") || null);
    const observer = new MutationObserver(() => {
      setPageTitle(main?.getAttribute("data-page-title") || null);
    });
    if (main) observer.observe(main, { attributes: true, attributeFilter: ["data-page-title"] });
    return () => observer.disconnect();
  }, [pathname]);

  const title = pageTitle ?? fallbackTitle;

  return (
    <header
      className={`app-topbar fixed inset-x-0 top-0 z-40 border-b border-[var(--card-border)] bg-[var(--topbar-bg)] pt-[env(safe-area-inset-top)] backdrop-blur transition-transform duration-200 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* Fila 1: avatar · título · búsqueda · campana · módulos */}
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          aria-label="Mi perfil"
          className="press grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-sm font-bold text-[var(--color-text)]"
          type="button"
          onClick={() => navigate("/profile")}
        >
          {profile ? initials(profile.full_name) : ""}
        </button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-[var(--color-text)]">{title}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Buscar"
            className="press grid size-10 place-items-center rounded-full text-[var(--color-text)]"
            type="button"
            onClick={() => navigate("/buscar")}
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
          <NotificationBell />
          <button
            aria-label="Módulos de Xignis"
            className="press grid size-10 place-items-center rounded-full text-[var(--color-text)]"
            type="button"
            onClick={() => setSwitcherOpen(true)}
          >
            <Grid2x2 aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      {/* Fila 2: wordmark de marca */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <span
          className="grid size-7 place-items-center rounded-lg bg-[var(--color-primary)]"
          aria-hidden="true"
        >
          <Check className="size-4 text-white" strokeWidth={3} />
        </span>
        <span
          className="text-lg font-bold tracking-tight text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          xig<span className="text-[var(--color-primary)]">nis</span>
        </span>
      </div>

      {/* Fila 3: tabs horizontales (mismo diseño en mobile y desktop, estilo iOS) */}
      {tabs.length > 0 ? (
        <nav aria-label="Secciones" className="flex gap-5 overflow-x-auto px-4">
          {tabs.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `press shrink-0 border-b-2 pb-2 pt-1 text-sm font-bold transition-colors ${
                  isActive
                    ? "border-[var(--color-primary)] text-[var(--color-text)]"
                    : "border-transparent text-[var(--color-muted)]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      {role ? (
        <ModuleSwitcherSheet isOpen={switcherOpen} role={role} onClose={() => setSwitcherOpen(false)} />
      ) : null}
    </header>
  );
}
