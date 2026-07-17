import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { RequestDetailLayout } from "../../leave-requests/components/RequestDetailLayout";
import type { LeaveRequest } from "../../../lib/database.types";
import { cancelLeaveRequest } from "../../leave-requests/services/leaveRequestService";
import { successHaptic } from "../../../lib/haptics";
import { usePageTitle } from "../../../lib/usePageTitle";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

const CANCELLABLE = new Set(["pending_manager", "approved_by_manager", "pending_hr"]);

export function LeaveRequestDetailScreen() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePageTitle("Mi solicitud");
  const confirm = useConfirm();
  const toast = useToast();

  async function handleCancel(id: string) {
    const accepted = await confirm({ confirmLabel: "Cancelar solicitud", description: "La solicitud dejará de avanzar por el flujo de aprobación.", destructive: true, title: "¿Cancelar esta solicitud?" });
    if (!accepted) return;
    try {
      setIsCancelling(true);
      await cancelLeaveRequest(id);
      void successHaptic();
      toast({ message: "La solicitud fue cancelada.", tone: "success" });
      navigate("/employee", { replace: true });
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "No se pudo cancelar la solicitud.");
    } finally {
      setIsCancelling(false);
    }
  }

  const id = requestId ?? "";

  return (
    <RequestDetailLayout
      actions={(request: LeaveRequest) =>
        CANCELLABLE.has(request.status) ? (
          <>
            {error ? (
              <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              className="w-full border-red-200 text-red-700"
              variant="secondary"
              disabled={isCancelling}
              onClick={() => void handleCancel(id)}
            >
              <X aria-hidden="true" className="size-5" />
              {isCancelling ? "Cancelando…" : "Cancelar solicitud"}
            </Button>
          </>
        ) : null
      }
      onBack={() => navigate("/employee")}
      requestId={id}
      title="Detalle"
    />
  );
}
