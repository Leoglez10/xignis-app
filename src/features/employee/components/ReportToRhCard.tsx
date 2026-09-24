import { MessageSquareWarning, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { listMyReports, reportStatusLabel } from "../../hr-reports/services/hrReportsService";
import type { HrReport } from "../../../lib/database.types";
import { ReportToRhSheet } from "./ReportToRhSheet";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

function statusClasses(status: HrReport["status"]) {
  return status === "open"
    ? "bg-amber-100 text-amber-800"
    : "bg-emerald-100 text-emerald-800";
}

export function ReportToRhCard() {
  const [isOpen, setIsOpen] = useState(false);
  const query = useQuery({
    queryKey: ["my-hr-reports"],
    queryFn: async () => listMyReports().catch(() => [] as HrReport[]),
  });

  const reports = query.data ?? [];
  const recent = useMemo(() => reports.slice(0, 3), [reports]);

  return (
    <>
      <article
        aria-label="Reportar a RH"
        className="animate-fade-up rounded-2xl bg-[var(--color-surface)] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-muted)]">Reportar a RH</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text)]">
              ¿Algo para contarnos?
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <MessageSquareWarning aria-hidden="true" className="size-5" />
          </span>
        </div>

        <Button
          className="mt-4 w-full"
          onClick={() => setIsOpen(true)}
          variant="secondary"
        >
          <Plus aria-hidden="true" className="size-4" />
          Nuevo reporte
        </Button>

        <div className="mt-4 space-y-2">
          {query.isLoading ? (
            <div className="h-12 rounded-xl bg-[var(--skeleton-base)] animate-pulse" />
          ) : recent.length === 0 ? (
            <p className="text-center text-xs text-[var(--color-muted)]">
              No tenés reportes.
            </p>
          ) : (
            recent.map((report) => (
              <div
                className="flex items-center justify-between gap-2 rounded-xl bg-[var(--card-bg)] px-3 py-2"
                key={report.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">
                    {report.subject}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {timeAgo(report.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses(report.status)}`}
                >
                  {reportStatusLabel[report.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </article>

      <ReportToRhSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
