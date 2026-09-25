import { Crown, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { isOwnerCompanyPath } from "../app/navConfig";
import { useOwnerViewMode, type OwnerViewMode } from "../features/owner/ownerViewMode";

/**
 * Selector de vista del dueño con reportes directos: "Dueño + Jefe" (empresa y
 * equipo) o "Jefe · N" (solo su equipo). Reemplaza los chips Dueño/Jefe. En
 * móvil solo se ven los iconos; el texto queda para lectores de pantalla.
 */
export function OwnerViewToggle({ directReports }: { directReports: number }) {
  const [mode, setMode] = useOwnerViewMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function choose(next: OwnerViewMode) {
    if (next === mode) return;
    setMode(next);
    // Al pasar a "solo equipo" desde una página de toda la empresa, ir al inicio del equipo.
    if (next === "team" && isOwnerCompanyPath(pathname)) navigate("/manager");
  }

  const options: { icon: typeof Crown; label: string; mode: OwnerViewMode; tone: string }[] = [
    { icon: Crown, label: "Dueño + Jefe", mode: "owner", tone: "bg-amber-400 text-amber-900" },
    { icon: Users, label: `Jefe · ${directReports}`, mode: "team", tone: "bg-sky-100 text-sky-800" },
  ];

  return (
    <div aria-label="Vista" className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--color-surface)] p-0.5" role="group">
      {options.map(({ icon: Icon, label, mode: option, tone }) => (
        <button
          aria-pressed={mode === option}
          className={`press inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold transition-colors sm:px-2.5 ${
            mode === option ? tone : "text-[var(--color-muted)]"
          }`}
          key={option}
          type="button"
          onClick={() => choose(option)}
        >
          <Icon aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
