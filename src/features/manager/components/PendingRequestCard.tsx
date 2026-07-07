import { CheckCircle2, XCircle } from "lucide-react";
import { memo } from "react";
import { Button } from "../../../components/ui/Button";
import { leaveTypeConfig } from "../../leave-requests/config";
import { formatDateRange, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type PendingRequestCardProps = {
  actionId: string | null;
  mount?: boolean;
  onReview: (id: string, decision: "approved" | "rejected") => void;
  request: LeaveRequestWithEmployee;
};

export const PendingRequestCard = memo(function PendingRequestCard({
  actionId,
  mount = false,
  onReview,
  request,
}: PendingRequestCardProps) {
  return (
    <article
      className="animate-fade-up rounded-[20px] bg-[var(--card-bg)] p-4 ring-1 ring-[var(--card-border)]"
      data-mount={mount ? "true" : undefined}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black">{request.employee?.full_name ?? "Empleado"}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {leaveTypeConfig[request.leave_type].label} - {formatDateRange(request)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
          Sin conflicto registrado
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          className="press w-full"
          disabled={actionId === request.id}
          onClick={() => onReview(request.id, "approved")}
        >
          <CheckCircle2 aria-hidden="true" className="size-5" />
          Aprobar y pasar a RH
        </Button>
        <Button
          className="press w-full border-red-200 text-red-700"
          disabled={actionId === request.id}
          variant="secondary"
          onClick={() => onReview(request.id, "rejected")}
        >
          <XCircle aria-hidden="true" className="size-5" />
          Rechazar
        </Button>
      </div>
    </article>
  );
});