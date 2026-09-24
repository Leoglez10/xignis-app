import { CheckCircle2, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { AdminShell } from "../components/adminNav";
import { listAllOwnerRequests, resolveOwnerRequest } from "../../owner/services/ownerService";
import { listEmployees } from "../../profiles/services/profileService";
import type { OwnerRequest } from "../../../lib/database.types";

type FilterKey = "all" | "open" | "resolved";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "open", label: "Abiertas" },
  { key: "resolved", label: "Resueltas" },
  { key: "all", label: "Todas" },
];

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}m`;
}

export function AdminOwnerRequestsScreen() {
  const [filter, setFilter] = useState<FilterKey>("open");
  const [resolving, setResolving] = useState<string | null>(null);
  const requestsQuery = useQuery({
    queryKey: ["admin", "owner-requests"],
    queryFn: listAllOwnerRequests,
  });
  const employeesQuery = useQuery({
    queryKey: ["admin", "owner-requests", "employees"],
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
    if (filter === "all") return requestsQuery.data ?? [];
    return (requestsQuery.data ?? []).filter((r) => r.status === filter);
  }, [requestsQuery.data, filter]);

  async function handleResolve(id: string) {
    try {
      setResolving(id);
      await resolveOwnerRequest(id);
      await requestsQuery.refetch();
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
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Pedidos de dueños</h2>
        </header>

        <div aria-label="Filtro de pedidos" className="mb-5 flex flex-wrap gap-2" role="group">
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

        {requestsQuery.error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {requestsQuery.error instanceof Error
              ? requestsQuery.error.message
              : "No se pudieron cargar los pedidos."}
          </p>
        ) : null}

        {requestsQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div className="h-24 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-10 text-center ring-1 ring-slate-200">
            <CheckCircle2 aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              No hay pedidos {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}.
            </p>
          </div>
        ) : (
          <ul className="stagger space-y-3">
            {filtered.map((req) => (
              <RequestItem
                key={req.id}
                namesById={namesById}
                onResolve={handleResolve}
                request={req}
                resolving={resolving === req.id}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function RequestItem({
  namesById,
  onResolve,
  request,
  resolving,
}: {
  namesById: Map<string, string>;
  onResolve: (id: string) => void;
  request: OwnerRequest;
  resolving: boolean;
}) {
  return (
    <li className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
          <span className="text-sm font-bold text-[var(--color-text)]">
            {namesById.get(request.owner_id) ?? "Dueño"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              request.status === "open"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {request.status === "open" ? "Abierta" : "Resuelta"}
          </span>
        </div>
        <span className="text-xs text-[var(--color-muted)]">{timeAgo(request.created_at)}</span>
      </div>
      <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
        {request.message}
      </p>
      {request.status === "open" ? (
        <Button
          className="w-full sm:w-auto"
          disabled={resolving}
          loading={resolving}
          onClick={() => onResolve(request.id)}
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Marcar resuelta
        </Button>
      ) : null}
    </li>
  );
}
