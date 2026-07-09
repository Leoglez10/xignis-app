import { BarChart3, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type AdminNavItem = { icon: LucideIcon; label: string; to: string };

export const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: "Inicio", to: "/admin" },
  { icon: Users, label: "Empleados", to: "/admin/employees" },
  { icon: BarChart3, label: "Reportes", to: "/admin/reports" },
  { icon: Settings, label: "Reglas", to: "/admin/rules" },
];

function isActive(pathname: string, to: string) {
  return to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
}

/** Sidebar oscuro para escritorio (RH/admin). */
export function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="hidden bg-slate-950 p-5 text-white md:flex md:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-2xl bg-[var(--color-primary)] text-lg font-black">X</div>
        <div>
          <p className="font-black">Xignis RH</p>
          <p className="text-xs text-slate-400">Recursos Humanos</p>
        </div>
      </div>

      <nav aria-label="Navegacion RH" className="space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={`press flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
                active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              key={item.label}
              onClick={() => navigate(item.to)}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/** Barra inferior fija para celular (RH/admin). */
export function AdminBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Navegacion RH"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
          return (
            <li className="flex-1" key={item.label}>
              <button
                aria-current={active ? "page" : undefined}
                className={`press flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-black ${
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                }`}
                onClick={() => navigate(item.to)}
                type="button"
              >
                <Icon aria-hidden="true" className={`size-5 ${active ? "text-[var(--color-primary)]" : ""}`} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Layout RH: barra inferior horizontal (igual que jefe) + contenido. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-50 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">{children}</div>
      <AdminBottomNav />
    </main>
  );
}
