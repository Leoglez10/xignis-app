import { AlertOctagon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { leaveTypeLabel } from "../../leave-requests/config";
import type { StagnantRequest } from "../services/dashboardService";

type StagnantRequestsWidgetProps = {
  items: StagnantRequest[];
};

export function StagnantRequestsWidget({ items }: StagnantRequestsWidgetProps) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Solicitudes estancadas"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertOctagon aria-hidden="true" className="size-4 text-rose-600" />
        <h2 className="font-black">Solicitudes estancadas</h2>
        <span className="ml-auto rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-800">
          {items.length}
        </span>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">Con más de 72 h sin resolver.</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className="press flex w-full items-center gap-3 rounded-2xl bg-rose-50 p-3 text-left ring-1 ring-rose-100"
              type="button"
              onClick={() => navigate(`/admin/requests/${item.id}`)}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-200 text-[10px] font-black text-rose-900">
                {item.daysOld}d
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{item.employee_name}</p>
                <p className="truncate text-xs text-rose-900/80">
                  {leaveTypeLabel[item.leave_type]} · desde {item.start_date}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
