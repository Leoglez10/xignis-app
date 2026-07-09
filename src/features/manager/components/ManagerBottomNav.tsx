import { CalendarDays, Home, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/manager", label: "Inicio", icon: Home, end: true },
  { to: "/manager/team", label: "Equipo", icon: Users, end: false },
  { to: "/manager/calendar", label: "Agenda", icon: CalendarDays, end: false },
];

export function ManagerBottomNav() {
  return (
    <nav
      aria-label="Navegación de jefe"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li className="flex-1" key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `press flex flex-col items-center gap-1 py-2.5 text-[11px] font-black ${
                  isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon aria-hidden="true" className={`size-5 ${isActive ? "text-[var(--color-primary)]" : ""}`} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
