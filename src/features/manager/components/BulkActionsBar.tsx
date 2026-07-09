import { Check, X } from "lucide-react";
import { useState } from "react";
import { bulkReviewLeaveRequests } from "../../leave-requests/services/leaveRequestService";

type BulkActionsBarProps = {
  ids: string[];
  onComplete: () => void;
  reviewerRole: "manager" | "hr_admin" | "admin";
};

export function BulkActionsBar({ ids, onComplete, reviewerRole }: BulkActionsBarProps) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (ids.length === 0) return null;

  async function handle(decision: "approved" | "rejected") {
    setBusy(decision === "approved" ? "approve" : "reject");
    setFeedback(null);
    try {
      const res = await bulkReviewLeaveRequests({ decision, ids, reviewerRole });
      setFeedback(`${res.ok} procesadas${res.errors.length > 0 ? ` · ${res.errors.length} con error` : ""}`);
      onComplete();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Error al procesar el lote.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      role="region"
      aria-label="Acciones en lote"
      className="animate-scale-in sticky bottom-3 z-30 mx-auto mt-4 flex max-w-md items-center gap-2 rounded-2xl bg-slate-950 p-2 text-white shadow-2xl ring-1 ring-slate-800"
    >
      <span className="px-3 text-sm font-black">{ids.length} selecionadas</span>
      <div className="ml-auto flex gap-1">
        <button
          className="press inline-flex h-10 items-center gap-1 rounded-full bg-emerald-500 px-3 text-xs font-black text-emerald-950 disabled:opacity-50"
          disabled={busy !== null}
          type="button"
          onClick={() => handle("approved")}
        >
          <Check aria-hidden="true" className="size-4" />
          {busy === "approve" ? "…" : "Aprobar"}
        </button>
        <button
          className="press inline-flex h-10 items-center gap-1 rounded-full bg-rose-500 px-3 text-xs font-black text-rose-950 disabled:opacity-50"
          disabled={busy !== null}
          type="button"
          onClick={() => handle("rejected")}
        >
          <X aria-hidden="true" className="size-4" />
          {busy === "reject" ? "…" : "Rechazar"}
        </button>
      </div>
      {feedback ? (
        <span aria-live="polite" className="sr-only">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
