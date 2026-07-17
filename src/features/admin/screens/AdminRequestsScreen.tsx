import { CheckCircle2, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminRequestCard } from "../components/AdminRequestCard";
import { AdminShell } from "../components/adminNav";
import { leaveTypeLabel, statusLabel, type LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { isInFlight } from "../../leave-requests/services/leaveRequestProgressService";
import { InProgressRequestCard } from "../../leave-requests/components/InProgressRequestCard";
import { useHrLeaveRequests } from "../hooks/useHrLeaveRequests";

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "all", label: "Todas" },
];

function matchesFilter(status: LeaveRequestWithEmployee["status"], filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "pending_hr" || status === "approved_by_manager";
  if (filter === "approved") return status === "approved";
  if (filter === "rejected") return status === "rejected" || status === "rejected_by_manager";
  return false;
}

function exportCsv(rows: LeaveRequestWithEmployee[]) {
  const header = ["Empleado", "Puesto", "Tipo", "Inicio", "Fin", "Estado", "Enviada"];
  const body = rows.map((r) => [
    r.employee?.full_name ?? "",
    r.employee?.job_title ?? "",
    leaveTypeLabel[r.leave_type],
    r.start_date,
    r.end_date,
    statusLabel[r.status],
    new Date(r.created_at).toLocaleString(),
  ]);
  const csv = [header, ...body]
    .map((cells) => cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xignis-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Full HR/admin requests management. Relocated from the dashboard: search,
 * CSV export, status filter chips, the in-flight request card, and the full
 * filtered requests list. Behavior matches the previous dashboard
 * implementation; only its home moved. Reads from the shared requests hook so
 * it does not pull the dashboard's heavy analytics query.
 */
export function AdminRequestsScreen() {
  const navigate = useNavigate();
  const { error, isLoading, requests } = useHrLeaveRequests();
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [query, setQuery] = useState("");

  const inFlightRequest = useMemo(() => {
    const inFlight = requests.filter((r) => isInFlight(r.status));
    inFlight.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return inFlight[0] ?? null;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (!matchesFilter(r.status, filter)) return false;
      if (q && !(r.employee?.full_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, filter, query]);

  return (
    <AdminShell>
      <div className="min-h-dvh">
        <section className="flex flex-col gap-5 bg-slate-50 p-4 pb-24 pt-4 md:p-6 md:pb-24">

          <header className="animate-fade-up">
            <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Solicitudes</h2>
          </header>

          {inFlightRequest ? (
            <InProgressRequestCard
              requestId={inFlightRequest.id}
              showEmployee
              title="Solicitud en cola"
              onView={(id) => navigate(`/admin/requests/${id}`)}
            />
          ) : null}

          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <section className="flex flex-col gap-3 rounded-[20px] bg-white p-4 ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="sr-only">Buscar solicitudes</span>
              <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                className="h-11 w-full rounded-full bg-slate-50 pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                placeholder="Buscar empleado"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white"
              type="button"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
            >
              <Download aria-hidden="true" className="size-4" />
              Exportar CSV
            </button>
          </section>

          <div aria-label="Filtro de solicitudes" className="flex flex-wrap gap-2" role="group">
            {FILTERS.map((f) => (
              <button
                aria-pressed={filter === f.key}
                className={`press rounded-full px-4 py-2 text-xs font-bold transition ${
                  filter === f.key ? "bg-slate-950 text-white" : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
                }`}
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <section aria-labelledby="recent-title">
            <h2 className="mb-3 text-base font-bold md:text-lg" id="recent-title">
              Solicitudes {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div className="h-20 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={i} />
                ))}
              </div>
            ) : (
              <ul className="stagger space-y-3">
                {filtered.length === 0 ? (
                  <li className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-10 text-center ring-1 ring-slate-200">
                    <CheckCircle2 aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
                    <p className="text-sm font-semibold text-[var(--color-muted)]">
                      No hay solicitudes para este filtro.
                    </p>
                  </li>
                ) : null}
                {filtered.map((request) => (
                  <AdminRequestCard
                    key={request.id}
                    onClick={() => navigate(`/admin/requests/${request.id}`)}
                    request={request}
                  />
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
    </AdminShell>
  );
}
