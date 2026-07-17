import { CheckCircle2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ManagerShell } from "../components/managerNav";
import { isInFlight } from "../../leave-requests/services/leaveRequestProgressService";
import { InProgressRequestCard } from "../../leave-requests/components/InProgressRequestCard";
import { AgingBadge } from "../../../components/ui/AgingBadge";
import { BulkActionsBar } from "../components/BulkActionsBar";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { PendingRequestCard } from "../components/PendingRequestCard";
import { RefreshBoundary } from "../components/RefreshBoundary";
import { TopRequesters } from "../components/TopRequesters";
import { useManagerPendingRequests } from "../hooks/useManagerPendingRequests";

/**
 * Full pending-requests management for a manager's team. Relocated from the
 * dashboard: multi-select queue, per-item aging badge, bulk approve/reject,
 * the in-flight request card, and the top-requesters widget. Behavior matches
 * the previous dashboard implementation; only its home moved.
 */
export function ManagerRequestsScreen() {
  const navigate = useNavigate();
  const { absences, error, isLoading, pending, refetch, team } = useManagerPendingRequests();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const mountedOnce = useRef(false);

  const inFlightRequest = useMemo(
    () => pending.find((r) => isInFlight(r.status)) ?? null,
    [pending],
  );

  const markMountOnce = () => {
    if (mountedOnce.current) return false;
    mountedOnce.current = true;
    return true;
  };

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  return (
    <ManagerShell>
      <RefreshBoundary onRefresh={refetch}>
        <section className="grid min-h-dvh gap-5 p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] md:p-6 md:pb-24">
          <div className="min-w-0 bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6">
            <header className="animate-fade-up mb-6">
              <p className="text-sm font-black text-[var(--color-muted)]">Jefe</p>
              <h2 className="mt-1 text-2xl font-black md:text-3xl">Solicitudes</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {isLoading ? "Cargando…" : `${pending.length} pendientes de tu equipo`}
              </p>
            </header>

            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {inFlightRequest ? (
                  <div className="mb-5">
                    <InProgressRequestCard
                      requestId={inFlightRequest.id}
                      showEmployee
                      title="Solicitud en curso de tu equipo"
                      onView={(id) => navigate(`/manager/requests/${id}`)}
                    />
                  </div>
                ) : null}

                {error ? (
                  <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}

                <section className="rounded-[24px] bg-[var(--card-muted)] p-4" aria-labelledby="manager-pending-title">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-black md:text-xl" id="manager-pending-title">
                      Pendientes de tu equipo
                    </h2>
                    <span className="rounded-full bg-[var(--card-bg)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                      {pending.length} abiertas
                    </span>
                  </div>

                  <ul className="stagger space-y-3">
                    {pending.length === 0 ? (
                      <li className="flex flex-col items-center gap-2 rounded-[20px] bg-[var(--card-bg)] p-8 text-center ring-1 ring-[var(--card-border)]">
                        <CheckCircle2 aria-hidden="true" className="size-8 text-emerald-500" />
                        <p className="text-sm font-semibold text-[var(--color-muted)]">
                          No hay solicitudes pendientes para tu equipo.
                        </p>
                      </li>
                    ) : null}
                    {pending.map((request) => (
                      <li className="relative" key={request.id}>
                        <PendingRequestCard
                          mount={markMountOnce()}
                          onClick={() => navigate(`/manager/requests/${request.id}`)}
                          onToggleSelect={toggleSelect}
                          request={request}
                          selected={selected.has(request.id)}
                        />
                        <span className="absolute right-16 top-4">
                          <AgingBadge request={request} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-5 flex flex-col gap-5" aria-label="Widgets de equipo">
                  <TopRequesters members={team} requests={absences} />
                </section>
              </>
            )}
            {!isLoading ? (
              <BulkActionsBar
                ids={Array.from(selected)}
                onComplete={() => {
                  clearSelection();
                  void refetch();
                }}
                reviewerRole="manager"
              />
            ) : null}
          </div>
        </section>
      </RefreshBoundary>
    </ManagerShell>
  );
}
