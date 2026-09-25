import { ChevronRight } from "lucide-react";
import { memo, useMemo } from "react";
import { initials } from "../../../lib/avatar";
import { formatDateRangeEs } from "../../../lib/date";
import { leaveTypeConfig } from "../../leave-requests/config";
import type { StepState } from "../../leave-requests/services/leaveRequestProgressService";
import { leaveTypeLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { buildAdminRequestRowModel, type AdminRequestRowModel } from "./adminRequestRowModel";

type AdminRequestRowProps = {
  onClick: () => void;
  request: LeaveRequestWithEmployee;
};

const DOT_CLASS: Record<StepState, string> = {
  active: "bg-amber-400 ring-4 ring-amber-400/30",
  done: "bg-emerald-500",
  pending: "border-2 border-slate-300 bg-transparent",
  rejected: "bg-red-500",
  skipped: "border-2 border-slate-300 bg-transparent opacity-40",
};

const TEXT_CLASS: Partial<Record<StepState, string>> = {
  active: "text-amber-700",
  rejected: "text-red-700",
};

/** Compact visual stepper; the accessible text lives in the parent row. */
function RowStepper({ steps }: { steps: StepState[] }) {
  return (
    <span aria-hidden="true" className="flex items-center">
      {steps.map((state, i) => (
        <span className="flex items-center" key={i}>
          {i > 0 ? (
            <span
              className={`h-0.5 w-4 sm:w-6 ${
                state === "done" || state === "active" || state === "rejected" ? "bg-emerald-500" : "bg-slate-200"
              } ${state === "skipped" ? "opacity-40" : ""}`}
            />
          ) : null}
          <span className={`block size-2.5 shrink-0 rounded-full ${DOT_CLASS[state]}`} />
        </span>
      ))}
    </span>
  );
}

/** Compact stepper plus current-stage text (with its accessible label).
 *  Shared by the HR list rows and the manager's team pending rows. */
export function RequestRowProgress({ model }: { model: AdminRequestRowModel }) {
  const currentState = model.steps[model.currentStep - 1];
  return (
    <span className="mt-1.5 flex min-w-0 items-center gap-2.5">
      <RowStepper steps={model.steps} />
      <span className="sr-only">
        Etapa {model.currentStep} de {model.steps.length}: {model.statusText}
      </span>
      <span
        aria-hidden="true"
        className={`truncate text-xs font-semibold ${TEXT_CLASS[currentState] ?? "text-[var(--color-muted)]"}`}
      >
        {model.statusText}
      </span>
    </span>
  );
}

/**
 * Single row of the HR requests list: avatar, name · type, dates, compact
 * approval stepper and an action pill. The whole row is one button; the pill
 * is purely visual to avoid nested interactive elements.
 */
export const AdminRequestRow = memo(function AdminRequestRow({ onClick, request }: AdminRequestRowProps) {
  const config = leaveTypeConfig[request.leave_type];
  const name = request.employee?.full_name ?? "Empleado";
  const model = useMemo(() => buildAdminRequestRowModel(request), [request]);

  return (
    <li data-mount="true">
      <button
        aria-label={`Abrir solicitud de ${name}`}
        className="press flex w-full items-center gap-3 px-4 py-3.5 text-left"
        type="button"
        onClick={onClick}
      >
        <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${config.avatarTone}`}>
          {initials(request.employee?.full_name ?? "X")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-sm font-bold">
              {name}
              <span className="font-semibold text-[var(--color-muted)]"> · {leaveTypeLabel[request.leave_type]}</span>
            </span>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              {formatDateRangeEs(request.start_date, request.end_date)}
            </span>
          </span>
          <RequestRowProgress model={model} />
        </span>

        {model.isActionable ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-950 py-1.5 pl-3 pr-2 text-xs font-bold text-white">
            Revisar
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-[var(--color-muted)]">
            Ver
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </span>
        )}
      </button>
    </li>
  );
});
