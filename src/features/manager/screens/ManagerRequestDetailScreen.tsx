import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import { reviewLeaveRequest } from "../../leave-requests/services/leaveRequestService";
import { successHaptic } from "../../../lib/haptics";
import { usePageTitle } from "../../../lib/usePageTitle";
import type { LeaveRequest } from "../../../lib/database.types";

export function ManagerRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  usePageTitle("Detalle");
  const [isWorking, setIsWorking] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleReview(id: string, decision: "approved" | "rejected") {
    try {
      setIsWorking(true);
      await reviewLeaveRequest({ comment: comment.trim() || undefined, decision, id, reviewerRole: "manager" });
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
          <>
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
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {rejecting ? (
                <Button disabled={isWorking} variant="secondary" onClick={() => setRejecting(false)}>
                  Volver
                </Button>
              ) : (
                <Button disabled={isWorking} onClick={() => void handleReview(id, "approved")}>
                  <CheckCircle2 aria-hidden="true" className="size-5" />
                  Aprobar
                </Button>
              )}
              <Button
                className="border-red-200 text-red-700"
                disabled={isWorking || (rejecting && comment.trim().length === 0)}
                variant="secondary"
                onClick={() => (rejecting ? void handleReview(id, "rejected") : setRejecting(true))}
              >
                <XCircle aria-hidden="true" className="size-5" />
                {rejecting ? "Confirmar rechazo" : "Rechazar"}
              </Button>
            </div>
          </>
        ) : null
      }
      onBack={() => navigate("/manager")}
      requestId={id}
      showEmployee
      title="Detalle"
    />
  );
}
