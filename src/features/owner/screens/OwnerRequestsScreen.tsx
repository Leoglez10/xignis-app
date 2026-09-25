import { CheckCircle2, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminRequestRow } from "../../admin/components/AdminRequestRow";
import { AdminShell } from "../../admin/components/adminNav";
import {
  leaveTypeLabel,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { listHrLeaveRequests } from "../../leave-requests/services/leaveRequestService";
import { OwnerReadOnlyBanner } from "../components/OwnerReadOnlyBanner";

type FilterKey = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "all", label: "Todas" },
];

function matchesFilter(status: LeaveRequestWithEmployee["status"], filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "pending_hr" || status === "approved_by_manager" || status === "pending_manager";
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

export function OwnerRequestsScreen() {
  const navigate = useNavigate();
  const { data: requests, error, isLoading } = useQuery({
    queryKey: ["owner", "requests"],
    queryFn: () => listHrLeaveRequests(),
  });
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (requests ?? []).filter((r) => {
      if (!matchesFilter(r.status, filter)) return false;
      if (q && !(r.employee?.full_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, filter, query]);

  return (
    <AdminShell>
      <div className="min-h-dvh bg-slate-50">
        <section className="page-wrap flex flex-col gap-5 pb-24 pt-4 md:pt-6">
          <header className="animate-fade-up">
            <p className="text-sm font-bold text-[var(--color-muted)]">Suite del dueño</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Solicitudes</h2>
          </header>

          <OwnerReadOnlyBanner />

          {error ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {error instanceof Error ? error.message : "No se pudieron cargar las solicitudes."}
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
              className="press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              disabled={filtered.length === 0}
              type="button"
              onClick={() => exportCsv(filtered)}
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
                  filter === f.key
                    ? "bg-amber-500 text-white"
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

          <section aria-labelledby="recent-title">
            <h2 className="mb-3 text-base font-bold md:text-lg" id="recent-title">
              Solicitudes {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}
            </h2>

            {isLoading ? (
              <div className="divide-y divide-[var(--card-border)] overflow-hidden rounded-[20px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]">
                {[0, 1, 2].map((i) => (
                  <div className="flex items-center gap-3 px-4 py-3.5" key={i}>
                    <div className="size-10 shrink-0 animate-pulse rounded-full bg-[var(--skeleton-base)]" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--skeleton-base)]" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-[var(--skeleton-base)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[20px] bg-[var(--card-bg)] p-10 text-center ring-1 ring-[var(--card-border)]">
                <CheckCircle2 aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
                <p className="text-sm font-semibold text-[var(--color-muted)]">No hay solicitudes para este filtro.</p>
              </div>
            ) : (
              <ul className="stagger divide-y divide-[var(--card-border)] overflow-hidden rounded-[20px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]">
                {filtered.map((request) => (
                  <AdminRequestRow
                    key={request.id}
                    onClick={() => navigate(`/owner/requests/${request.id}`)}
                    readOnly
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
