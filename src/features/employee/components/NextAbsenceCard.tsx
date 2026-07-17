import { Plane } from "lucide-react";
import { formatDateRangeEs } from "../../../lib/date";
import { leaveTypeLabel } from "../../leave-requests/config";
import { diffDaysInclusive, daysFromToday } from "../../../lib/date";
import type { LeaveRequest } from "../../../lib/database.types";

type NextAbsenceCardProps = {
  request: LeaveRequest;
};

export function NextAbsenceCard({ request }: NextAbsenceCardProps) {
  const daysUntil = daysFromToday(request.start_date);
  const duration = diffDaysInclusive(request.start_date, request.end_date);
  const returnDate = new Date(`${request.end_date}T00:00:00`);
  returnDate.setDate(returnDate.getDate() + 1);
  const returnIso = returnDate.toISOString().slice(0, 10);
  const isOngoing = daysUntil <= 0;
  const headline = isOngoing ? "Estás de permiso" : daysUntil === 1 ? "Mañana sales" : `Faltan ${daysUntil} días`;
  return (
    <article
      aria-label="Próximo permiso"
      className="animate-fade-up flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
        <Plane aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-indigo-900">{headline}</p>
        <p className="mt-0.5 truncate text-xs text-indigo-800">
          {leaveTypeLabel[request.leave_type]} · {formatDateRangeEs(request.start_date, request.end_date)} ·{" "}
          {duration} {duration === 1 ? "día" : "días"}
        </p>
      </div>
      {!isOngoing ? (
        <p className="shrink-0 text-xs font-bold text-indigo-700">
          Vuelve {formatDateRangeEs(returnIso, returnIso)}
        </p>
      ) : null}
    </article>
  );
}
