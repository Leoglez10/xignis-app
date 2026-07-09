import { ChevronRight } from "lucide-react";
import { memo } from "react";
import { formatDateRangeEs } from "../../../lib/date";
import { leaveTypeConfig, statusTone } from "../../leave-requests/config";
import {
  formatDateRange,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";

type PendingRequestCardProps = {
  mount?: boolean;
  onClick: () => void;
  onToggleSelect?: (id: string) => void;
  request: LeaveRequestWithEmployee;
  selected?: boolean;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

export const PendingRequestCard = memo(function PendingRequestCard({
  mount = false,
  onClick,
  onToggleSelect,
  request,
  selected = false,
}: PendingRequestCardProps) {
  const config = leaveTypeConfig[request.leave_type];
  return (
    <li>
      <div
        className={`flex w-full items-center gap-3 rounded-[20px] bg-[var(--card-bg)] p-3 text-left ring-1 transition ${
          selected ? "ring-2 ring-[var(--color-primary)]" : "ring-[var(--card-border)]"
        }`}
        data-mount={mount ? "true" : undefined}
      >
        {onToggleSelect ? (
          <label className="grid size-12 shrink-0 cursor-pointer place-items-center">
            <input
              aria-label={`Seleccionar solicitud de ${request.employee?.full_name ?? "empleado"}`}
              checked={selected}
              className="size-5 cursor-pointer accent-[var(--color-primary)]"
              type="checkbox"
              onChange={() => onToggleSelect(request.id)}
            />
          </label>
        ) : (
          <span className={`grid size-12 shrink-0 place-items-center rounded-full text-xs font-black ${config.avatarTone}`}>
            {initials(request.employee?.full_name ?? "X")}
          </span>
        )}
        <button
          className="press flex min-w-0 flex-1 items-center gap-3 text-left"
          type="button"
          onClick={onClick}
          aria-label={`Abrir solicitud de ${request.employee?.full_name ?? "empleado"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-black">{request.employee?.full_name ?? "Empleado"}</span>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[request.status]}`}>
                {statusLabel[request.status]}
              </span>
            </span>
            <span className="mt-1 block truncate text-xs text-[var(--color-muted)]">
              {config.label} · {formatDateRangeEs(request.start_date, request.end_date)}
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
        </button>
      </div>
    </li>
  );
});