import { CheckCircle2, Clock, History, TriangleAlert, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import {
  formatDateRange,
  leaveTypeLabel,
  reviewLeaveRequest,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";
import { diffDaysInclusive } from "../../../lib/date";
import { successHaptic } from "../../../lib/haptics";
import { usePageTitle } from "../../../lib/usePageTitle";
import type { LeaveRequest } from "../../../lib/database.types";
import { useManagerRequestContext } from "../hooks/useManagerRequestContext";

export function ManagerRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  usePageTitle("Detalle");
  const [isWorking, setIsWorking] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleReview(id: string, decision: "approved" | "rejected") {
    try {
      setIsWorking(true);
      const reviewComment = decision === "approved" ? approveComment.trim() : comment.trim();
      await reviewLeaveRequest({
        comment: reviewComment || undefined,
        decision,
        id,
        reviewerRole: "manager",
      });
      void successHaptic();
      navigate("/manager", { replace: true });
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setIsWorking(false);
    }
  }

  const id = requestId ?? "";

  return (
    <RequestDetailLayout
      actions={(request: LeaveRequest) =>
        request.status === "pending_manager" ? (
          <RequestReviewActions
            approveComment={approveComment}
            error={error}
            isWorking={isWorking}
            rejecting={rejecting}
            request={request}
            setApproveComment={setApproveComment}
            setComment={setComment}
            setRejecting={setRejecting}
            onReview={handleReview}
          />
        ) : null
      }
      onBack={() => navigate("/manager")}
      requestId={id}
      showEmployee
      title="Detalle"
    />
  );
}

type RequestReviewActionsProps = {
  approveComment: string;
  error: string | null;
  isWorking: boolean;
  rejecting: boolean;
  request: LeaveRequest;
  setApproveComment: (value: string) => void;
  setComment: (value: string) => void;
  setRejecting: (value: boolean) => void;
  onReview: (id: string, decision: "approved" | "rejected") => Promise<void>;
};

function RequestReviewActions({
  approveComment,
  error,
  isWorking,
  rejecting,
  request,
  setApproveComment,
  setComment,
  setRejecting,
  onReview,
}: RequestReviewActionsProps) {
  const { balance, balanceError, history, overlaps, timeBank } = useManagerRequestContext(
    request.employee_id,
    request.start_date,
    request.end_date,
  );

  const requestDays = diffDaysInclusive(request.start_date, request.end_date);
  const exceedsBalance =
    !balanceError &&
    balance !== null &&
    request.leave_type === "vacation" &&
    request.paid &&
    requestDays > balance.available;

  const recentHistory = history
    .filter((r) => r.id !== request.id)
    .slice(0, 3)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return (
    <div className="mt-auto pt-8">
      {/* Contexto del solicitante */}
      <section
        aria-labelledby="requester-context-title"
        className="mb-5 rounded-[24px] bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] shadow-sm"
      >
        <h2
          id="requester-context-title"
          className="mb-4 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]"
        >
          Contexto del solicitante
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
              <History aria-hidden="true" className="size-4" />
              Vacaciones
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              {balance ? balance.available : "—"}
              <span className="ml-1 text-sm font-bold text-[var(--color-muted)]">
                disponibles de {balance?.quota ?? "—"} al año
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
              <Clock aria-hidden="true" className="size-4" />
              Banco de horas
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              {timeBank ? timeBank.availableHours.toFixed(1) : "—"}
              <span className="ml-1 text-sm font-bold text-[var(--color-muted)]">h disponibles</span>
            </p>
          </div>
        </div>

        {exceedsBalance ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              Esta solicitud excede el saldo disponible ({balance?.available} {balance?.available === 1 ? "día disponible" : "días disponibles"}).
            </span>
          </div>
        ) : null}

        <div className="mt-3 rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
            <History aria-hidden="true" className="size-4" />
            Historial reciente
          </div>
          {recentHistory.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">Sin solicitudes recientes.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recentHistory.map((r) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={r.id}>
                  <span className="font-bold text-[var(--color-text)]">{leaveTypeLabel[r.leave_type]}</span>
                  <span className="text-[var(--color-muted)]">{formatDateRange(r)}</span>
                  <span className="rounded-full bg-[var(--card-bg)] px-2 py-0.5 text-xs font-bold text-[var(--color-muted)] ring-1 ring-[var(--card-border)]">
                    {statusLabel[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
            <Users aria-hidden="true" className="size-4" />
            Solapamientos con el equipo
          </div>
          {overlaps.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">Sin solapamientos con el equipo.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {overlaps.map((o) => (
                <li className="flex items-center justify-between gap-3 text-sm" key={o.id}>
                  <span className="font-bold text-[var(--color-text)]">{o.employee?.full_name ?? "Equipo"}</span>
                  <span className="text-[var(--color-muted)]">{formatDateRange(o)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {error ? (
        <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {rejecting ? (
        <label className="mb-3 block">
          <span className="text-sm font-bold">Motivo del rechazo (requerido)</span>
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-2xl bg-[var(--card-bg)] p-4 text-sm outline-none ring-1 ring-[var(--card-border)] focus:ring-2 focus:ring-[var(--color-focus)]"
            placeholder="Explica el motivo para el colaborador"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
      ) : (
        <label className="mb-3 block">
          <span className="text-sm font-bold">Comentario (opcional)</span>
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-2xl bg-[var(--card-bg)] p-4 text-sm outline-none ring-1 ring-[var(--card-border)] focus:ring-2 focus:ring-[var(--color-focus)]"
            placeholder="Comentario para el colaborador al aprobar"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
          />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {rejecting ? (
          <Button disabled={isWorking} variant="secondary" onClick={() => setRejecting(false)}>
            Volver
          </Button>
        ) : (
          <Button disabled={isWorking} onClick={() => void onReview(request.id, "approved")}>
            <CheckCircle2 aria-hidden="true" className="size-5" />
            Aprobar
          </Button>
        )}
        <Button
          className="border-red-200 text-red-700"
          disabled={isWorking || (rejecting && comment.trim().length === 0)}
          variant="secondary"
          onClick={() => (rejecting ? void onReview(request.id, "rejected") : setRejecting(true))}
        >
          <XCircle aria-hidden="true" className="size-5" />
          {rejecting ? "Confirmar rechazo" : "Rechazar"}
        </Button>
      </div>
    </div>
  );
}
