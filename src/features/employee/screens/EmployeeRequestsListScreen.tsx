import { ChevronLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leaveTypeConfig, statusTone } from "../../leave-requests/config";
import {
  formatDateRange,
  leaveTypeLabel,
  listMyLeaveRequests,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";
import type { LeaveRequest, LeaveStatus } from "../../../lib/database.types";
import { subscribeToLeaveRequests } from "../../leave-requests/services/leaveRequestProgressService";
import { Button } from "../../../components/ui/Button";

type StatusFilter = "all" | LeaveStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending_manager", label: "Pend. jefe" },
  { key: "approved_by_manager", label: "Aprob. jefe" },
  { key: "pending_hr", label: "Pend. RH" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "cancelled", label: "Canceladas" },
];

export function EmployeeRequestsListScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const requestsQuery = useInfiniteQuery<LeaveRequest[]>({
    initialPageParam: 0,
    queryKey: ["leave-requests", "mine", "infinite"],
    queryFn: ({ pageParam }) => listMyLeaveRequests({ limit: 30, offset: pageParam as number }),
    getNextPageParam: (lastPage, pages) => lastPage.length === 30 ? pages.length * 30 : undefined,
  });
  useEffect(() => subscribeToLeaveRequests({}, () => { void queryClient.invalidateQueries({ queryKey: ["leave-requests", "mine"] }); }), [queryClient]);
  const requests = requestsQuery.data?.pages.flat() ?? [];
  const isLoading = requestsQuery.isLoading;
  const error = requestsQuery.error instanceof Error ? requestsQuery.error.message : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !leaveTypeLabel[r.leave_type].toLowerCase().includes(q)) return false;
      return true;
    });
  }, [requests, filter, query]);

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-28 pt-4 lg:px-8">
        <header className="animate-fade-up mb-5 flex items-center gap-3">
          <button
            aria-label="Volver"
            className="press grid size-11 place-items-center rounded-full bg-[var(--color-surface)]"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold">Mis solicitudes</h2>
            <p className="text-sm text-[var(--color-muted)]">
              {isLoading ? "Cargando…" : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </header>

        <label className="relative mb-3 block">
          <span className="sr-only">Buscar por tipo</span>
          <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className="h-11 w-full rounded-full bg-[var(--color-surface)] pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            placeholder="Buscar por tipo (vacaciones, enfermedad…)"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div aria-label="Filtro por estado" className="mb-4 flex flex-wrap gap-2" role="group">
          {STATUS_FILTERS.map((f) => (
            <button
              aria-pressed={filter === f.key}
              className={`press rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === f.key ? "bg-slate-950 text-white" : "bg-[var(--color-surface)] text-[var(--color-muted)]"
              }`}
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="stagger flex-1 space-y-3">
          {isLoading ? (
            [0, 1, 2, 3].map((i) => (
              <li className="h-20 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={i} />
            ))
          ) : filtered.length === 0 ? (
            <li className="rounded-2xl bg-[var(--color-surface)] p-8 text-center text-sm font-semibold text-[var(--color-muted)]">
              Sin solicitudes para este filtro.
            </li>
          ) : (
            filtered.map((r) => {
              const cfg = leaveTypeConfig[r.leave_type];
              return (
                <li key={r.id}>
                  <button
                    className="press flex w-full items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 text-left"
                    type="button"
                    onClick={() => navigate(`/employee/requests/${r.id}`)}
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-bold ${cfg.avatarTone}`}
                    >
                      {cfg.label.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{cfg.label}</p>
                      <p className="truncate text-xs text-[var(--color-muted)]">{formatDateRange(r)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusTone[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {requestsQuery.hasNextPage ? <Button className="mt-4 w-full" loading={requestsQuery.isFetchingNextPage} variant="secondary" onClick={() => void requestsQuery.fetchNextPage()}>Ver más solicitudes</Button> : null}
      </section>
    </main>
  );
}
