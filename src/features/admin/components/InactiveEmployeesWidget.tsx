import { initials } from "../../../lib/avatar";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { InactiveEmployee } from "../services/dashboardService";

type InactiveEmployeesWidgetProps = {
  items: InactiveEmployee[];
};

export function InactiveEmployeesWidget({ items }: InactiveEmployeesWidgetProps) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Empleados sin actividad"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Clock aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
        <h2 className="font-black">Sin actividad reciente</h2>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">
        Más de 6 meses sin solicitudes. Útil para detectar cuellos de botella.
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className="press flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left"
              type="button"
              onClick={() => navigate(`/admin/employees`)}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                {initials(item.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{item.full_name}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">{item.job_title ?? "Sin puesto"}</p>
              </div>
              <span className="shrink-0 text-[10px] font-black text-[var(--color-muted)]">
                {item.daysSince}d
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
