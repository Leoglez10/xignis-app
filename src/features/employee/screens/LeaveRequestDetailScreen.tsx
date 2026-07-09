import { ChevronLeft, Clock, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { LeaveRequest, LeaveStatus } from "../../../lib/database.types";
import { statusTone } from "../../leave-requests/config";
import {
  cancelLeaveRequest,
  formatDateRange,
  getLeaveRequest,
  leaveTypeLabel,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";

const statusDetail: Record<
  LeaveStatus,
  {
    cardTone: string;
    folioTone: string;
    intro: string;
    nextTone: string;
    nextIconTone: string;
    nextTitleTone: string;
    nextTextTone: string;
    nextTitle: string;
    nextText: string;
  }
> = {
  approved: {
    cardTone: "bg-emerald-50",
    folioTone: "text-emerald-800/80",
    intro: "Tu solicitud fue aprobada. El permiso ya quedo confirmado.",
    nextTone: "bg-emerald-50",
    nextIconTone: "text-emerald-700",
    nextTitleTone: "text-emerald-900",
    nextTextTone: "text-emerald-800",
    nextTitle: "Proceso completo",
    nextText: "Ya no necesitas hacer nada mas para esta solicitud.",
  },
  approved_by_manager: {
    cardTone: "bg-indigo-50",
    folioTone: "text-indigo-800/80",
    intro: "Tu jefe ya aprobo la solicitud. Falta validacion final de RH.",
    nextTone: "bg-indigo-50",
    nextIconTone: "text-indigo-700",
    nextTitleTone: "text-indigo-900",
    nextTextTone: "text-indigo-800",
    nextTitle: "Pendiente RH",
    nextText: "RH revisara la aprobacion y te avisaremos cuando quede confirmada o rechazada.",
  },
  cancelled: {
    cardTone: "bg-slate-100",
    folioTone: "text-slate-700/80",
    intro: "Cancelaste esta solicitud. Ya no seguira el flujo de aprobacion.",
    nextTone: "bg-slate-100",
    nextIconTone: "text-slate-600",
    nextTitleTone: "text-slate-900",
    nextTextTone: "text-slate-700",
    nextTitle: "Sin acciones",
    nextText: "Puedes crear una nueva solicitud si necesitas otro permiso.",
  },
  pending_hr: {
    cardTone: "bg-amber-50",
    folioTone: "text-amber-800/80",
    intro: "Tu solicitud esta en revision por RH.",
    nextTone: "bg-amber-50",
    nextIconTone: "text-amber-700",
    nextTitleTone: "text-amber-900",
    nextTextTone: "text-amber-800",
    nextTitle: "Pendiente RH",
    nextText: "Te avisaremos cuando RH apruebe o rechace la solicitud.",
  },
  pending_manager: {
    cardTone: "bg-orange-50",
    folioTone: "text-orange-800/80",
    intro: "Tu solicitud esta pendiente de revision por tu jefe.",
    nextTone: "bg-orange-50",
    nextIconTone: "text-orange-700",
    nextTitleTone: "text-orange-900",
    nextTextTone: "text-orange-800",
    nextTitle: "Pendiente jefe",
    nextText: "Cuando tu jefe responda, la solicitud pasara a RH si fue aprobada.",
  },
  rejected: {
    cardTone: "bg-red-50",
    folioTone: "text-red-800/80",
    intro: "RH rechazo esta solicitud.",
    nextTone: "bg-red-50",
    nextIconTone: "text-red-700",
    nextTitleTone: "text-red-900",
    nextTextTone: "text-red-800",
    nextTitle: "Solicitud rechazada",
    nextText: "Si tienes dudas, revisa el motivo con RH.",
  },
  rejected_by_manager: {
    cardTone: "bg-red-50",
    folioTone: "text-red-800/80",
    intro: "Tu jefe rechazo esta solicitud.",
    nextTone: "bg-red-50",
    nextIconTone: "text-red-700",
    nextTitleTone: "text-red-900",
    nextTextTone: "text-red-800",
    nextTitle: "Solicitud rechazada",
    nextText: "Si necesitas corregir algo, crea una nueva solicitud.",
  },
};

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
  const detail = request ? statusDetail[request.status] : null;

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

        {request && detail ? (
          <section className={`rounded-[24px] p-5 ${detail.cardTone}`}>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone[request.status]}`}>
              {statusLabel[request.status]}
            </span>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-text)]">{leaveTypeLabel[request.leave_type]}</h2>
            <p className={`mt-3 text-sm leading-6 ${detail.nextTextTone}`}>{detail.intro}</p>
            <p className={`mt-4 text-xs font-semibold ${detail.folioTone}`}>Folio: {request.id}</p>
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

        {detail ? (
          <section className={`mt-3 rounded-2xl p-4 ${detail.nextTone}`} aria-labelledby="next-step-title">
            <div className="mb-2 flex items-center gap-2">
              <Clock aria-hidden="true" className={`size-4 ${detail.nextIconTone}`} />
              <h2 className={`text-sm font-black ${detail.nextTitleTone}`} id="next-step-title">
                {detail.nextTitle}
              </h2>
            </div>
            <p className={`text-sm leading-6 ${detail.nextTextTone}`}>{detail.nextText}</p>
          </section>
        ) : null}

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
