import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Plane,
  Stethoscope,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import type { LeaveRequest, LeaveType } from "../../../lib/database.types";
import { leaveTypeConfig, statusTone } from "../config";
import {
  buildApprovalSteps,
  statusLabel,
  type LeaveRequestApproval,
  type StepState,
} from "../services/leaveRequestProgressService";
import {
  formatDateRange,
  leaveTypeLabel,
  type LeaveRequestWithEmployee,
} from "../services/leaveRequestService";
import { useLiveLeaveRequest } from "../hooks/useLiveLeaveRequest";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { EmployeeAvatar } from "./EmployeeAvatar";

const LEAVE_TYPE_ICON: Record<LeaveType, LucideIcon> = {
  vacation: Plane,
  personal: Utensils,
  sick: Stethoscope,
  other: User,
};

const STATE_HERO: Record<
  StepState,
  { ring: string; chipBg: string; title: string; bar: string; label: string }
> = {
  done: {
    ring: "bg-emerald-500",
    chipBg: "bg-emerald-50 text-emerald-700",
    title: "text-emerald-900",
    bar: "bg-emerald-500",
    label: "Completado",
  },
  active: {
    ring: "bg-amber-500",
    chipBg: "bg-amber-50 text-amber-700",
    title: "text-amber-900",
    bar: "bg-amber-500 animate-pulse",
    label: "En curso",
  },
  pending: {
    ring: "bg-slate-200 text-slate-500",
    chipBg: "bg-slate-100 text-slate-500",
    title: "text-slate-500",
    bar: "bg-slate-200",
    label: "Pendiente",
  },
  rejected: {
    ring: "bg-red-500",
    chipBg: "bg-red-50 text-red-700",
    title: "text-red-700",
    bar: "bg-red-500",
    label: "Rechazado",
  },
  skipped: {
    ring: "bg-slate-200 text-slate-400",
    chipBg: "bg-slate-100 text-slate-400",
    title: "text-slate-400",
    bar: "bg-slate-100",
    label: "Omitido",
  },
};

type RequestDetailLayoutProps = {
  requestId: string;
  title: string;
  onBack: () => void;
  /** Render prop: recibe la solicitud en vivo. */
  actions?: (request: LeaveRequest) => ReactNode;
  /** true para mostrar el nombre del empleado (manager/admin). */
  showEmployee?: boolean;
};

export function RequestDetailLayout({
  actions,
  onBack,
  requestId,
  showEmployee = false,
  title,
}: RequestDetailLayoutProps) {
  const [expanded, setExpanded] = useState(false);

  const { request, approvals, hasManager, isLoading, error } = useLiveLeaveRequest(requestId, {
    withEmployee: showEmployee,
  });

  const steps = useMemo(
    () => (request ? buildApprovalSteps(request, approvals, hasManager) : []),
    [request, approvals, hasManager],
  );

  const currentStep = useMemo(() => steps.find((s) => s.state === "active"), [steps]);
  const hero = currentStep ? STATE_HERO[currentStep.state] : null;

  if (isLoading) {
    return (
      <DetailShell title={title} onBack={onBack}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-[var(--skeleton-base)]" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-32 rounded bg-[var(--skeleton-base)]" />
              <div className="h-4 w-24 rounded bg-[var(--skeleton-base)]" />
            </div>
          </div>
          <div className="space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div className="flex gap-3" key={i}>
                <div className="size-8 rounded-full bg-[var(--skeleton-base)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-[var(--skeleton-base)]" />
                  <div className="h-2 w-1/3 rounded bg-[var(--skeleton-base)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DetailShell>
    );
  }

  if (error || !request) {
    return (
      <DetailShell title={title} onBack={onBack}>
        <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
          {error ?? "No se pudo cargar la solicitud."}
        </p>
      </DetailShell>
    );
  }

  const LeaveIcon = LEAVE_TYPE_ICON[request.leave_type] ?? User;
  const typeConfig = leaveTypeConfig[request.leave_type];
  const allDone = !currentStep && request.status === "approved";

  return (
    <DetailShell title={title} onBack={onBack}>
      <section className="rounded-[24px] bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <span
            className={`grid size-16 shrink-0 place-items-center rounded-full ${typeConfig.avatarTone}`}
          >
            <LeaveIcon aria-hidden="true" className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold text-[var(--color-text)]">
              {typeConfig.label}
            </h2>
            <p className="mt-0.5 truncate text-sm font-bold text-[var(--color-muted)]">
              {formatDateRange(request)}
            </p>
          </div>
        </div>

        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone[request.status]}`}>
          {statusLabel[request.status]}
        </span>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <span
              className={`block h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : hero?.bar ?? "bg-slate-200"}`}
              style={{ width: `${(steps.filter((s) => s.state === "done").length / Math.max(steps.length, 1)) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-[var(--color-muted)]">
            {allDone
              ? "Permiso confirmado"
              : currentStep
                ? `Etapa ${steps.indexOf(currentStep) + 1} de ${steps.length} · ${currentStep.subtitle}`
                : `${steps.filter((s) => s.state === "done").length} de ${steps.length} etapas`}
          </p>
        </div>

        {showEmployee ? (() => {
          const emp = (request as LeaveRequestWithEmployee).employee;
          return (
            <div className="mt-3 flex items-center gap-2">
              <EmployeeAvatar
                fullName={emp?.full_name ?? "Empleado"}
                avatarUrl={emp?.avatar_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--color-text)]">
                  {emp?.full_name ?? "Empleado"}
                </p>
                {emp?.job_title ? (
                  <p className="truncate text-xs text-[var(--color-muted)]">{emp.job_title}</p>
                ) : null}
              </div>
            </div>
          );
        })() : null}

        {request.rejection_reason ? (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            <span className="font-bold">Motivo: </span>
            {request.rejection_reason}
          </p>
        ) : null}
      </section>

      {/* Timeline */}
      <section className="mt-4 rounded-[24px] bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] shadow-sm" aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="mb-4 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
          Progreso de aprobación
        </h2>
        <ApprovalTimeline steps={steps} />
      </section>

      {/* Collapsible details */}
      <details
        className="mt-4 rounded-[24px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]"
        onToggle={(e) => setExpanded((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="press flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-bold text-[var(--color-text)]">
          <span className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
            Más detalles
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 text-[var(--color-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </summary>
        <div className="space-y-3 px-5 pb-5">
          <DetailRow icon={CalendarDays} label="Fechas" value={formatDateRange(request)} />
          <DetailRow
            icon={Clock}
            label="Horario"
            value={request.schedule_type === "full_day" ? "Día completo" : `${request.start_time} – ${request.end_time}`}
          />
          <DetailRow
            icon={Clock}
            label="Enviada"
            value={new Date(request.created_at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          />
          <DetailRow icon={FileText} label="Folio" value={request.id} mono />
          {request.coverage_contact ? <DetailRow icon={FileText} label="Responsable suplente" value={request.coverage_contact} /> : null}
          {request.pending_tasks ? (
            <div className="rounded-2xl bg-[var(--card-muted)] p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                <FileText aria-hidden="true" className="size-3" />
                Actividades pendientes
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{request.pending_tasks}</p>
            </div>
          ) : null}
        </div>
      </details>

      {actions ? (
        <div className="mt-auto pt-8">{actions(request)}</div>
      ) : null}
    </DetailShell>
  );
}

function DetailRow({
  icon: Icon,
  label,
  mono,
  value,
}: {
  icon: LucideIcon;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--card-muted)] px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </span>
      <span className={`text-right text-sm font-bold text-[var(--color-text)] ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function DetailShell({
  actions,
  children,
  onBack,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  onBack: () => void;
  title: string;
}) {
  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-7 pt-5 lg:px-8">
        <header className="mb-5 grid grid-cols-[44px_1fr_44px] items-center">
          <button
            aria-label="Volver"
            className="press grid size-11 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
            type="button"
            onClick={onBack}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h2 className="text-center text-lg font-bold text-[var(--color-text)]">{title}</h2>
        </header>
        {children}
      </section>
    </main>
  );
}
