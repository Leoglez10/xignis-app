import { Sparkles } from "lucide-react";
import { formatDateRangeEs, daysFromToday } from "../../../lib/date";
import { leaveTypeLabel } from "../../leave-requests/config";
import type { LeaveRequest } from "../../../lib/database.types";

type ActivePermitBannerProps = {
  request: LeaveRequest;
};

export function ActivePermitBanner({ request }: ActivePermitBannerProps) {
  const daysElapsed = Math.abs(daysFromToday(request.start_date)) + 1;
  const returnDate = new Date(`${request.end_date}T00:00:00`);
  returnDate.setDate(returnDate.getDate() + 1);
  const returnIso = returnDate.toISOString().slice(0, 10);
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-up flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
        <Sparkles aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-emerald-900">Estás de permiso hoy</p>
        <p className="mt-0.5 truncate text-xs text-emerald-800">
          {leaveTypeLabel[request.leave_type]} · día {daysElapsed} de {request.start_date} a {request.end_date}
        </p>
      </div>
      <p className="shrink-0 text-xs font-black text-emerald-700">
        Vuelve {formatDateRangeEs(returnIso, returnIso)}
      </p>
    </div>
  );
}
