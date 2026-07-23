import { Check, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { AgingBadge } from "../../../components/ui/AgingBadge";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";
import { leaveTypeConfig } from "../../leave-requests/config";
import { formatDateRangeEs } from "../../../lib/date";
import { successHaptic } from "../../../lib/haptics";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type UrgentRequestItemProps = {
  request: LeaveRequestWithEmployee;
  onReview: (input: { id: string; decision: "approved" | "rejected" }) => Promise<unknown>;
  onDetail: () => void;
};

export function UrgentRequestItem({ request, onReview, onDetail }: UrgentRequestItemProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);

  const name = request.employee?.full_name ?? "Empleado";
  const cfg = leaveTypeConfig[request.leave_type];

  async function review(decision: "approved" | "rejected") {
    const approving = decision === "approved";
    const ok = await confirm({
      confirmLabel: approving ? "Aprobar" : "Rechazar",
      description: `${cfg.label} · ${formatDateRangeEs(request.start_date, request.end_date)} de ${name}.`,
      destructive: !approving,
      title: approving ? "Aprobar solicitud" : "Rechazar solicitud",
    });
    if (!ok) return;
    try {
      setBusy(decision);
      await onReview({ decision, id: request.id });
      void successHaptic();
      toast({ message: approving ? "Solicitud aprobada." : "Solicitud rechazada.", tone: "success" });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "No se pudo actualizar la solicitud.",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <li className="rounded-[20px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]">
      <button
        className="press flex w-full items-center gap-3 p-3 text-left"
        onClick={onDetail}
        type="button"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{name}</span>
          <span className="block truncate text-xs text-[var(--color-muted)]">
            {cfg.label} · {formatDateRangeEs(request.start_date, request.end_date)}
          </span>
        </span>
        <AgingBadge request={request} />
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
      </button>
      <div className="flex gap-2 border-t border-[var(--card-border)] p-2">
        <button
          className="press inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-xs font-bold text-white disabled:opacity-55"
          disabled={disabled}
          onClick={() => review("approved")}
          type="button"
        >
          <Check aria-hidden="true" className="size-4" />
          {busy === "approved" ? "…" : "Aprobar"}
        </button>
        <button
          className="press inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-50 text-xs font-bold text-rose-700 ring-1 ring-rose-200 disabled:opacity-55"
          disabled={disabled}
          onClick={() => review("rejected")}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
          {busy === "rejected" ? "…" : "Rechazar"}
        </button>
      </div>
    </li>
  );
}
