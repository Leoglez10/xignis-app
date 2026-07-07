import { ChevronLeft, Clock, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveRequest } from "../../../lib/database.types";
import {
  cancelLeaveRequest,
  formatDateRange,
  getLeaveRequest,
  leaveTypeLabel,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";

export function LeaveRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setError("Solicitud no encontrada.");
      setIsLoading(false);
      return;
    }

    getLeaveRequest(requestId)
      .then((data) => {
        setRequest(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la solicitud.");
      })
      .finally(() => setIsLoading(false));
  }, [requestId]);

  async function handleCancel() {
    if (!request) return;

    try {
      setIsCancelling(true);
      await cancelLeaveRequest(request.id);
      setRequest({ ...request, status: "cancelled" });
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "No se pudo cancelar la solicitud.");
    } finally {
      setIsCancelling(false);
    }
  }

  const summaryItems = request
    ? [
        ["Fechas", formatDateRange(request)],
        ["Horario", request.schedule_type === "full_day" ? "Completo" : `${request.start_time} - ${request.end_time}`],
        ["Enviada", new Date(request.created_at).toLocaleString()],
      ]
    : [];

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-7 pt-[calc(1.25rem+env(safe-area-inset-top))] lg:px-8">
        <header className="mb-5 grid grid-cols-[44px_1fr_44px] items-center">
          <button
            aria-label="Regresar al dashboard"
            className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
            type="button"
            onClick={() => navigate("/employee")}
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
          <section className="rounded-[24px] bg-orange-50 p-5">
            <span className="inline-flex rounded-full bg-orange-200 px-3 py-1 text-xs font-black text-orange-800">
              {statusLabel[request.status]}
            </span>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-text)]">{leaveTypeLabel[request.leave_type]}</h2>
            <p className="mt-3 text-sm leading-6 text-orange-800">
              Tu solicitud esta en seguimiento segun el flujo de aprobacion configurado.
            </p>
            <p className="mt-4 text-xs font-semibold text-orange-800/80">Folio: {request.id}</p>
          </section>
        ) : null}

        <section className="mt-5 space-y-3" aria-labelledby="request-summary-title">
          <h2 className="sr-only" id="request-summary-title">
            Resumen de solicitud
          </h2>
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
            <h2 className="text-sm font-black text-[var(--color-text)]" id="pending-tasks-title">
              Actividades pendientes
            </h2>
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">{request?.pending_tasks || "Sin actividades capturadas."}</p>
        </section>

        <section className="mt-3 rounded-2xl bg-emerald-50 p-4" aria-labelledby="next-step-title">
          <div className="mb-2 flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4 text-emerald-700" />
            <h2 className="text-sm font-black text-emerald-900" id="next-step-title">
              Siguiente paso
            </h2>
          </div>
          <p className="text-sm leading-6 text-emerald-800">
            Te avisaremos cuando el estado cambie a aprobada o rechazada.
          </p>
        </section>

        <div className="mt-auto pt-8">
          <Button
            className="w-full bg-[var(--color-surface)] text-[var(--color-text)]"
            disabled={!request || request.status === "cancelled" || isCancelling}
            variant="ghost"
            onClick={handleCancel}
          >
            <X aria-hidden="true" className="size-5" />
            {isCancelling ? "Cancelando..." : "Cancelar solicitud"}
          </Button>
        </div>
      </section>
    </main>
  );
}
