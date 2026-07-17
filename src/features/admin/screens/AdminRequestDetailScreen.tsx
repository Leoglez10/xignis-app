import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { usePageTitle } from "../../../lib/usePageTitle";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import { reviewLeaveRequest } from "../../leave-requests/services/leaveRequestService";
import { successHaptic } from "../../../lib/haptics";
import type { LeaveRequest } from "../../../lib/database.types";

const REVIEWABLE = new Set(["pending_hr", "approved_by_manager"]);

export function AdminRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  usePageTitle("Detalle RH");
  const [comment, setComment] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(id: string, decision: "approved" | "rejected") {
    try {
      setIsWorking(true);
      await reviewLeaveRequest({ comment: comment.trim() || undefined, decision, id, reviewerRole: "hr_admin" });
      void successHaptic();
      navigate("/admin", { replace: true });
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitude.");
    } finally {
      setIsWorking(false);
    }
  }

  const id = requestId ?? "";

  return (
    <RequestDetailLayout
      actions={(request: LeaveRequest) =>
        REVIEWABLE.has(request.status) ? (
          <>
            {error ? (
              <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <label className="mb-3 block">
              <span className="text-sm font-bold">Comentario (requerido para rechazar)</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl bg-[var(--card-bg)] p-4 text-sm outline-none ring-1 ring-[var(--card-border)] focus:ring-2 focus:ring-[var(--color-focus)]"
                placeholder="Para auditoría o seguimiento"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button disabled={isWorking} onClick={() => void handleReview(id, "approved")}>
                <CheckCircle2 aria-hidden="true" className="size-5" />
                Aprobar
              </Button>
              <Button
                className="border-red-200 text-red-700"
                disabled={isWorking || comment.trim().length === 0}
                variant="secondary"
                onClick={() => void handleReview(id, "rejected")}
              >
                <XCircle aria-hidden="true" className="size-5" />
                Rechazar
              </Button>
            </div>
          </>
        ) : null
      }
      onBack={() => navigate("/admin")}
      requestId={id}
      showEmployee
      title="Detalle RH"
    />
  );
}