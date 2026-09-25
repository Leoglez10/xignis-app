import { LifeBuoy, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { navGroups, ownerTeamTab } from "../app/navConfig";
import { useManagerPendingRequests } from "../features/manager/hooks/useManagerPendingRequests";
import { useOwnerNavOptions } from "../features/owner/hooks/useOwnerNavOptions";
import { useAuth } from "../features/session/AuthContext";
import { initials } from "../lib/avatar";
import { accountPath } from "../features/account/accountSections";

/**
 * Navegación lateral de escritorio. Lee las mismas tabs que la TopBar móvil
 * (`navConfig`), agrupadas por `group`: una sección nueva solo se agrega ahí y
 * aparece en las dos. Oculta por debajo de `md`, donde manda la TopBar.
 * El hueco que ocupa lo reserva `#main-content` en globals.css.
 */
export function Sidebar() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const navOptions = useOwnerNavOptions();
  const { hasDirectReports } = navOptions;

  if (!profile) return null;
  const groups = navGroups(profile.role, navOptions);

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-w)] flex-col border-r border-[var(--card-border)] bg-[var(--card-muted)] md:flex">
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          className="press flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 text-left"
          type="button"
          onClick={() => navigate(accountPath("perfil"))}
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
            {profile.role === "owner" && hasDirectReports ? (
              <span className="block truncate text-xs font-semibold text-[var(--color-muted)]">Dueño · Jefe</span>
            ) : null}
          </span>
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
                    {profile.role === "owner" && to === ownerTeamTab.to ? <TeamPendingBadge /> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--card-border)] px-3 py-3">
        <NavLink
          to={accountPath("apariencia")}
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
    </aside>
  );
}

/** Pendientes del equipo directo del dueño. Comparte la caché de la pantalla de
 *  aprobaciones (`useManagerPendingRequests`), así que no duplica consultas. */
function TeamPendingBadge() {
  const { pending } = useManagerPendingRequests();
  if (pending.length === 0) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-amber-100 px-1.5 py-0.5 text-center text-[10px] leading-none text-amber-800">
      <span className="sr-only">: </span>
      {pending.length}
    </span>
  );
}
