import { initials } from "../../../lib/avatar";
import { UserCheck } from "lucide-react";
import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { formatDateRangeEs } from "../../../lib/date";
import { leaveTypeConfig, statusTone } from "../../leave-requests/config";
import { leaveTypeLabel, statusLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type AdminRequestCardProps = {
  onClick: () => void;
  request: LeaveRequestWithEmployee;
};

export const AdminRequestCard = memo(function AdminRequestCard({ onClick, request }: AdminRequestCardProps) {
  const config = leaveTypeConfig[request.leave_type];
  const isApprovedByManager = request.status === "approved_by_manager";

  return (
    <li>
      <button
        className="press flex w-full items-center gap-3 rounded-[20px] bg-[var(--card-bg)] p-4 text-left ring-1 ring-[var(--card-border)]"
        type="button"
        onClick={onClick}
        aria-label={`Abrir solicitud de ${request.employee?.full_name ?? "empleado"}`}
      >
        <span className={`grid size-12 shrink-0 place-items-center rounded-full text-xs font-black ${config.avatarTone}`}>
          {initials(request.employee?.full_name ?? "X")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-black">{request.employee?.full_name ?? "Empleado"}</span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[request.status]}`}>
              {isApprovedByManager ? <UserCheck aria-hidden="true" className="size-3" /> : null}
              {statusLabel[request.status]}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs text-[var(--color-muted)]">
            {leaveTypeLabel[request.leave_type]} · {formatDateRangeEs(request.start_date, request.end_date)}
          </span>
          {isApprovedByManager ? (
            <span className="mt-1 block text-[11px] font-bold text-indigo-700">Espera validación de RH</span>
          ) : null}
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
      </button>
    </li>
  );
});