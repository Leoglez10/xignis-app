import { BarChart3, FileText, Inbox, SlidersHorizontal, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminQuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: UserPlus, label: "Invitar", to: "/admin/employees" },
    { icon: BarChart3, label: "Reportes", to: "/admin/reports" },
    { icon: FileText, label: "Reglas", to: "/admin/rules" },
    { icon: Inbox, label: "Solicitudes", to: "/admin/requests" },
    { icon: SlidersHorizontal, label: "Campos", to: "/admin/fields" },
  ];
  return (
    <section
      aria-label="Accesos rapidos"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            className="press flex flex-col items-center gap-2 rounded-2xl bg-[var(--card-bg)] p-4 ring-1 ring-[var(--card-border)]"
            key={action.label}
            type="button"
            onClick={() => navigate(action.to)}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xs font-bold">{action.label}</span>
          </button>
        );
      })}
    </section>
  );
}
