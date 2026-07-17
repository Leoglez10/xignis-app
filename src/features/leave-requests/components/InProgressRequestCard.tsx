import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { formatDateRange, leaveTypeLabel, type LeaveRequestWithEmployee } from "../services/leaveRequestService";
import {
  buildApprovalSteps,
  isInFlight,
  statusLabel,
} from "../services/leaveRequestProgressService";
import { useLiveLeaveRequest } from "../hooks/useLiveLeaveRequest";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { statusTone, leaveTypeConfig } from "../config";
import { EmployeeAvatar } from "./EmployeeAvatar";

type InProgressRequestCardProps = {
  requestId: string;
  onView?: (id: string) => void;
  /** Título del bloque, p.ej. "Solicitud en curso". */
  title?: string;
  /** true para mostrar el nombre del empleado (manager/admin). */
  showEmployee?: boolean;
};

export function InProgressRequestCard({
  requestId,
  onView,
  showEmployee = false,
  title = "Solicitud en curso",
}: InProgressRequestCardProps) {
  const { request, approvals, hasManager, isLoading } = useLiveLeaveRequest(requestId, {
    withEmployee: showEmployee,
  });

  const employee = useMemo(() => {
    if (!showEmployee || !request) return null;
    return (request as LeaveRequestWithEmployee).employee ?? null;
  }, [request, showEmployee]);

  const steps = useMemo(
    () =>
      request
        ? buildApprovalSteps(request, approvals, hasManager)
        : [],
    [request, approvals, hasManager],
  );

  const currentStepIndex = useMemo(() => {
    const activeIdx = steps.findIndex((s) => s.state === "active");
    if (activeIdx >= 0) return activeIdx + 1;
    const doneCount = steps.filter((s) => s.state === "done").length;
    return doneCount;
  }, [steps]);

  if (!isLoading && (!request || !isInFlight(request.status))) {
    return null;
  }

  return (
    <section
      aria-labelledby="in-progress-title"
      className="animate-fade-up rounded-[24px] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm"
    >
      <header className="mb-3 flex items-center gap-3">
        {showEmployee && employee ? (
          <EmployeeAvatar
            fullName={employee.full_name}
            avatarUrl={employee.avatar_url}
            size="md"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
            {title}
          </p>
          {request ? (
            <>
              <h2 id="in-progress-title" className="mt-1 truncate text-lg font-bold text-[var(--color-text)]">
                {leaveTypeLabel[request.leave_type]}
              </h2>
              {employee?.full_name ? (
                <p className="mt-0.5 truncate text-sm font-bold text-[var(--color-muted)]">
                  {employee.full_name}
                  {employee.job_title ? ` · ${employee.job_title}` : ""}
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-1 h-5 w-32 animate-pulse rounded bg-[var(--skeleton-base)]" />
          )}
        </div>
        {request ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusTone[request.status]}`}>
            {statusLabel[request.status]}
          </span>
        ) : null}
      </header>

      {request ? (
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {formatDateRange(request)}
          <span className="mx-2">·</span>
          Etapa {currentStepIndex} de {steps.length}
        </p>
      ) : (
        <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[var(--skeleton-base)]" />
      )}

      {isLoading && !request ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div className="flex gap-3" key={i}>
              <div className="size-8 animate-pulse rounded-full bg-[var(--skeleton-base)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--skeleton-base)]" />
                <div className="h-2 w-1/3 animate-pulse rounded bg-[var(--skeleton-base)]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ApprovalTimeline steps={steps} />
      )}

      {request && onView ? (
        <button
          className="press mt-4 flex w-full items-center justify-center gap-1 rounded-2xl bg-[var(--card-muted)] py-3 text-sm font-bold text-[var(--color-text)] ring-1 ring-[var(--card-border)]"
          type="button"
          onClick={() => onView(request.id)}
        >
          Ver detalle
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </section>
  );
}