import { initials } from "../../../lib/avatar";
import { memo } from "react";
import { formatDateRangeEs } from "../../../lib/date";
import { leaveTypeConfig } from "../../leave-requests/config";
import { leaveTypeLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type AgendaItemProps = {
  absence: LeaveRequestWithEmployee;
  mount?: boolean;
  onClick?: () => void;
};

export const AgendaItem = memo(function AgendaItem({ absence, mount = false, onClick }: AgendaItemProps) {
  const config = leaveTypeConfig[absence.leave_type];
  return (
    <li
      className="flex items-center gap-3 rounded-2xl bg-[var(--card-bg)] p-3 ring-1 ring-[var(--card-border)]"
      data-mount={mount ? "true" : undefined}
    >
      <button
        className="press flex w-full items-center gap-3 text-left"
        type="button"
        disabled={!onClick}
        onClick={onClick}
        aria-label={`Ver detalle de ${absence.employee?.full_name ?? "empleado"}`}
      >
        <span className={`grid size-12 shrink-0 place-items-center rounded-full text-xs font-black ${config.avatarTone}`}>
          {initials(absence.employee?.full_name ?? "X")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black">{absence.employee?.full_name ?? "Empleado"}</span>
          <span className="block truncate text-xs text-[var(--color-muted)]">
            {formatDateRangeEs(absence.start_date, absence.end_date)}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${config.chipTone}`}>
          {leaveTypeLabel[absence.leave_type]}
        </span>
      </button>
    </li>
  );
});