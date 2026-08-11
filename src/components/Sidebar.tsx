import { Grid2x2, LifeBuoy, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { navGroups } from "../app/navConfig";
import { useAuth } from "../features/session/AuthContext";
import { ModuleSwitcherSheet } from "./ModuleSwitcherSheet";
import { initials } from "../lib/avatar";

/**
 * Navegación lateral de escritorio. Lee las mismas tabs que la TopBar móvil
 * (`navConfig`), agrupadas por `group`: una sección nueva solo se agrega ahí y
 * aparece en las dos. Oculta por debajo de `md`, donde manda la TopBar.
 * El hueco que ocupa lo reserva `#main-content` en globals.css.
 */
export function Sidebar() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  if (!profile) return null;
  const groups = navGroups(profile.role);

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-w)] flex-col border-r border-[var(--card-border)] bg-[var(--card-muted)] md:flex">
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          className="press flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-left"
          type="button"
          onClick={() => navigate("/profile")}
        >
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text)]">
            {profile.avatar_url ? (
              <img alt="" className="size-full object-cover" src={profile.avatar_url} />
            ) : (
              initials(profile.full_name)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[var(--color-text)]">{profile.full_name}</span>
            <span
              className="block text-xs font-bold tracking-tight text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              xig<span className="text-[var(--color-primary)]">nis</span>
            </span>
          </span>
        </button>
        <button
          aria-label="Módulos de Xignis"
          className="press grid size-9 shrink-0 place-items-center rounded-xl text-[var(--color-muted)]"
          type="button"
          onClick={() => setSwitcherOpen(true)}
        >
          <Grid2x2 aria-hidden="true" className="size-5" />
        </button>
      </div>

      <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div className="mb-5" key={group.name}>
            <p className="px-3 pb-1.5 text-xs font-bold text-[var(--color-muted)]">{group.name}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, end, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `press flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-[var(--card-bg)] text-[var(--color-text)] shadow-sm ring-1 ring-[var(--card-border)]"
                          : "text-[var(--color-muted)] hover:bg-[var(--card-bg)]"
                      }`
                    }
                  >
                    <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--card-border)] px-3 py-3">
        <NavLink
          to="/settings"
          className="press flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-[var(--color-muted)] hover:bg-[var(--card-bg)]"
        >
          <Settings aria-hidden="true" className="size-4.5 shrink-0" />
          Ajustes
        </NavLink>
        <a
          className="press flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-[var(--color-muted)] hover:bg-[var(--card-bg)]"
          href="mailto:soporte@xignis.com"
        >
          <LifeBuoy aria-hidden="true" className="size-4.5 shrink-0" />
          Ayuda y soporte
        </a>
      </div>

      <ModuleSwitcherSheet isOpen={switcherOpen} role={profile.role} onClose={() => setSwitcherOpen(false)} />
    </aside>
  );
}
