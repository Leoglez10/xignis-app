import { CheckCircle2, Flag } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { AdminShell } from "../components/adminNav";
import { listAllReports, resolveReport, reportStatusLabel } from "../../hr-reports/services/hrReportsService";
import { listEmployees } from "../../profiles/services/profileService";
import type { HrReport } from "../../../lib/database.types";

type FilterKey = "all" | "open" | "resolved";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "open", label: "Abiertas" },
  { key: "resolved", label: "Resueltas" },
];

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

export function AdminReportsCenterScreen() {
  const [filter, setFilter] = useState<FilterKey>("open");
  const [resolving, setResolving] = useState<string | null>(null);
  const reportsQuery = useQuery({
    queryKey: ["admin", "hr-reports"],
    queryFn: listAllReports,
  });
  const employeesQuery = useQuery({
    queryKey: ["admin", "hr-reports", "employees"],
    queryFn: listEmployees,
  });

  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employeesQuery.data ?? []) {
      map.set(e.id, e.full_name);
    }
    return map;
  }, [employeesQuery.data]);

  const filtered = useMemo(() => {
    if (filter === "all") return reportsQuery.data ?? [];
    return (reportsQuery.data ?? []).filter((r) => r.status === filter);
  }, [reportsQuery.data, filter]);

  async function handleResolve(id: string) {
    try {
      setResolving(id);
      await resolveReport(id);
      await reportsQuery.refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setResolving(null);
    }
  }

  return (
    <AdminShell>
      <div className="page-wrap pb-24 pt-5 md:pt-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Reportes de empleados</h2>
        </header>

        <div aria-label="Filtro de reportes" className="mb-5 flex flex-wrap gap-2" role="group">
          {FILTERS.map((f) => (
            <button
              aria-pressed={filter === f.key}
              className={`press rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f.key
                  ? "bg-slate-950 text-white"
                  : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
              }`}
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {reportsQuery.error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {reportsQuery.error instanceof Error
              ? reportsQuery.error.message
              : "No se pudieron cargar los reportes."}
          </p>
        ) : null}

        {reportsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div className="h-28 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-10 text-center ring-1 ring-slate-200">
            <Flag aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              No hay reportes {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}.
            </p>
          </div>
        ) : (
          <ul className="stagger space-y-3">
            {filtered.map((report) => (
              <ReportItem
                key={report.id}
                namesById={namesById}
                onResolve={handleResolve}
                report={report}
                resolving={resolving === report.id}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function ReportItem({
  namesById,
  onResolve,
  report,
  resolving,
}: {
  namesById: Map<string, string>;
  onResolve: (id: string) => void;
  report: HrReport;
  resolving: boolean;
}) {
  return (
    <li className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Flag aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
          <span className="text-sm font-bold text-[var(--color-text)]">
            {namesById.get(report.reporter_id) ?? "Empleado"}
          </span>
          {report.request_anonymity ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              Pidió anonimato
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              report.status === "open"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {reportStatusLabel[report.status]}
          </span>
        </div>
        <span className="text-xs text-[var(--color-muted)]">{timeAgo(report.created_at)}</span>
      </div>

      <h3 className="text-sm font-extrabold text-[var(--color-text)]">{report.subject}</h3>
      <p className="mb-4 mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
        {report.message}
      </p>

      {report.status === "open" ? (
        <Button
          className="w-full sm:w-auto"
          disabled={resolving}
          loading={resolving}
          onClick={() => onResolve(report.id)}
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Marcar resuelta
        </Button>
      ) : null}
    </li>
  );
}
