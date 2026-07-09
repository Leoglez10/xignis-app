import { ChevronLeft, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveStatus } from "../../../lib/database.types";
import { leaveTypeConfig, statusTone } from "../../leave-requests/config";
import {
  formatDateRange,
  getLeaveRequestWithEmployee,
  reviewLeaveRequest,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";

const statusDetail: Record<LeaveStatus, { card: string; folio: string; panel: string; icon: string; title: string; text: string; body: string }> = {
  approved: {
    card: "bg-emerald-50",
    folio: "text-emerald-800/80",
    panel: "bg-emerald-50",
    icon: "text-emerald-700",
    title: "text-emerald-900",
    text: "text-emerald-800",
    body: "Permiso confirmado por RH. No requiere acción del jefe.",
  },
  approved_by_manager: {
    card: "bg-indigo-50",
    folio: "text-indigo-800/80",
    panel: "bg-indigo-50",
    icon: "text-indigo-700",
    title: "text-indigo-900",
    text: "text-indigo-800",
    body: "Ya aprobaste esta solicitud. RH tiene la validación final pendiente.",
  },
  cancelled: {
    card: "bg-slate-100",
    folio: "text-slate-700/80",
    panel: "bg-slate-100",
    icon: "text-slate-600",
    title: "text-slate-900",
    text: "text-slate-700",
    body: "El empleado canceló esta solicitud. No requiere acción.",
  },
  pending_hr: {
    card: "bg-amber-50",
    folio: "text-amber-800/80",
    panel: "bg-amber-50",
    icon: "text-amber-700",
    title: "text-amber-900",
    text: "text-amber-800",
    body: "Esta solicitud está esperando validación de RH.",
  },
  pending_manager: {
    card: "bg-orange-50",
    folio: "text-orange-800/80",
    panel: "bg-orange-50",
    icon: "text-orange-700",
    title: "text-orange-900",
    text: "text-orange-800",
    body: "Tu decisión pasará esta solicitud a RH para validación final.",
  },
  rejected: {
    card: "bg-red-50",
    folio: "text-red-800/80",
    panel: "bg-red-50",
    icon: "text-red-700",
    title: "text-red-900",
    text: "text-red-800",
    body: "RH rechazó esta solicitud. No requiere acción del jefe.",
  },
  rejected_by_manager: {
    card: "bg-red-50",
    folio: "text-red-800/80",
    panel: "bg-red-50",
    icon: "text-red-700",
    title: "text-red-900",
    text: "text-red-800",
    body: "Rechazaste esta solicitud. El flujo quedó cerrado.",
  },
};

export function ManagerRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [request, setRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setError("Solicitud no encontrada.");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getLeaveRequestWithEmployee(requestId);
        setRequest(data);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la solicitud.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [requestId]);

  async function handleReview(decision: "approved" | "rejected") {
    if (!request) return;
    try {
      setIsWorking(true);
      await reviewLeaveRequest({ decision, id: request.id, reviewerRole: "manager" });
      navigate("/manager", { replace: true });
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setIsWorking(false);
    }
  }

  const summaryItems = request
    ? [
        ["Fechas", formatDateRange(request)],
        ["Horario", request.schedule_type === "full_day" ? "Completo" : `${request.start_time} - ${request.end_time}`],
        ["Enviada", new Date(request.created_at).toLocaleString()],
      ]
    : [];
  const detail = request ? statusDetail[request.status] : null;

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-7 pt-[calc(1.25rem+env(safe-area-inset-top))] lg:px-8">
        <header className="mb-5 grid grid-cols-[44px_1fr_44px] items-center">
          <button
            aria-label="Regresar al panel"
            className="press grid size-11 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
            type="button"
            onClick={() => navigate("/manager")}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="text-center text-lg font-black text-[var(--color-text)]">Detalle</h1>
        </header>

        {isLoading ? (
          <section className="rounded-[24px] bg-[var(--color-surface)] p-5 text-sm font-bold text-[var(--color-muted)]">
            Cargando solicitud...
          </section>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {request ? (
          <>
            <section className={`rounded-[24px] p-5 ${detail?.card ?? "bg-orange-50"}`}>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone[request.status] ?? statusTone.pending_manager}`}>
                {statusLabel[request.status]}
              </span>
              <h2 className="mt-4 text-3xl font-black text-[var(--color-text)]">
                {leaveTypeConfig[request.leave_type].label}
              </h2>
              <p className="mt-2 text-sm font-black text-[var(--color-muted)]">
                {request.employee?.full_name ?? "Empleado"}
              </p>
              {request.employee?.job_title ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">{request.employee.job_title}</p>
              ) : null}
              <p className={`mt-3 text-xs font-semibold ${detail?.folio ?? "text-orange-800/80"}`}>Folio: {request.id}</p>
            </section>

            <section className="mt-5 space-y-3" aria-labelledby="request-summary-title">
              <h2 className="sr-only" id="request-summary-title">Resumen de solicitud</h2>
              {summaryItems.map(([label, value]) => (
                <div className="flex min-h-14 items-center justify-between rounded-2xl bg-[var(--color-surface)] px-4" key={label}>
                  <span className="text-sm font-bold text-[var(--color-text)]">{label}</span>
                  <span className="text-sm font-bold text-[var(--color-muted)]">{value}</span>
                </div>
              ))}
            </section>

            <section className="mt-3 rounded-2xl bg-[var(--color-surface)] p-4" aria-labelledby="pending-tasks-title">
              <div className="mb-2 flex items-center gap-2">
                <FileText aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
                <h2 className="text-sm font-black text-[var(--color-text)]" id="pending-tasks-title">Actividades pendientes</h2>
              </div>
              <p className="text-sm leading-6 text-[var(--color-muted)]">{request.pending_tasks || "Sin actividades capturadas."}</p>
            </section>

            <section className={`mt-3 rounded-2xl p-4 ${detail?.panel ?? "bg-orange-50"}`} aria-labelledby="next-step-title">
              <div className="mb-2 flex items-center gap-2">
                <Clock aria-hidden="true" className={`size-4 ${detail?.icon ?? "text-orange-700"}`} />
                <h2 className={`text-sm font-black ${detail?.title ?? "text-orange-900"}`} id="next-step-title">Siguiente paso</h2>
              </div>
              <p className={`text-sm leading-6 ${detail?.text ?? "text-orange-800"}`}>{detail?.body}</p>
            </section>

            {request.status === "pending_manager" ? (
              <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
                <Button className="press w-full" disabled={isWorking} onClick={() => handleReview("approved")}>
                  <CheckCircle2 aria-hidden="true" className="size-5" />
                  Aprobar
                </Button>
                <Button
                  className="press w-full border-red-200 text-red-700"
                  disabled={isWorking}
                  variant="secondary"
                  onClick={() => handleReview("rejected")}
                >
                  <XCircle aria-hidden="true" className="size-5" />
                  Rechazar
                </Button>
              </div>
            ) : (
              <p className="mt-auto pt-8 text-center text-sm font-semibold text-[var(--color-muted)]">
                Esta solicitud ya fue revisada.
              </p>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
