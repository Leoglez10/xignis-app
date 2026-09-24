import { ArrowRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { AgingBadge } from "../../../components/ui/AgingBadge";
import { Button } from "../../../components/ui/Button";
import { initials } from "../../../lib/avatar";
import { successHaptic } from "../../../lib/haptics";
import {
  formatDateRange,
  leaveTypeLabel,
  reviewLeaveRequest,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import type { InicioPrefs } from "../hooks/useInicioPrefs";
import type { AdminDashboardStats } from "../services/dashboardService";

type FocusBlockProps = {
  absentToday: number;
  isLoading: boolean;
  pending: LeaveRequestWithEmployee[];
  prefs: InicioPrefs;
  stats: AdminDashboardStats | null;
  onCustomize: () => void;
};

type Metric = { key: string; label: string; to: string; value: string };

const PREVIEW_COUNT = 3;

/** Bloque de foco del Inicio de RH: la bandeja de pendientes manda y las
 *  métricas viven en un riel lateral. Reemplaza la fila de accesos rápidos y
 *  la grilla de 6 KPIs: cada métrica del riel navega a su sección. */
export function FocusBlock({ absentToday, isLoading, onCustomize, pending, prefs, stats }: FocusBlockProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setError(null);
    setWorkingId(id);
    try {
      await reviewLeaveRequest({ decision: "approved", id, reviewerRole: "hr_admin" });
      void successHaptic();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leave-requests", "hr"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "admin"] }),
      ]);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "No se pudo aprobar la solicitud.");
    } finally {
      setWorkingId(null);
    }
  }

  const metrics: Metric[] = [];
  if (prefs.showActiveEmployees) {
    metrics.push({
      key: "employees",
      label: "Empleados activos",
      to: "/admin/employees",
      value: stats ? String(stats.activeEmployees) : "—",
    });
  }
  if (prefs.showAbsentToday) {
    metrics.push({ key: "absent", label: "Ausentes hoy", to: "/admin/absences", value: String(absentToday) });
  }
  if (prefs.showUtilization) {
    metrics.push({
      key: "utilization",
      label: "Vacaciones usadas",
      to: "/admin/reports",
      value: stats ? `${stats.utilizationPct}%` : "—",
    });
  }

  const preview = pending.slice(0, PREVIEW_COUNT);

  return (
    <section
      aria-labelledby="admin-focus-title"
      className="animate-fade-up grid overflow-hidden rounded-[24px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--card-border)] p-5 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2.5 text-lg font-bold md:text-xl" id="admin-focus-title">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-amber-600" />
            Requieren tu atención
          </h2>
          <NavLink
            className="press inline-flex items-center gap-1 text-xs font-bold text-[var(--color-muted)]"
            to="/admin/requests"
          >
            Ver las {pending.length}
            <ArrowRight aria-hidden="true" className="size-4" />
          </NavLink>
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {preview.length === 0 ? (
          <p className="py-6 text-center text-sm font-semibold text-[var(--color-muted)]">
            {isLoading ? "Cargando…" : "No hay solicitudes pendientes."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {preview.map((request) => (
              <li className="flex items-center gap-3 py-3" key={request.id}>
                <button
                  className="press flex min-w-0 flex-1 items-center gap-3 text-left"
                  type="button"
                  onClick={() => navigate(`/admin/requests/${request.id}`)}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-muted)]">
                    {initials(request.employee?.full_name ?? "")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {request.employee?.full_name ?? "Empleado"}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {leaveTypeLabel[request.leave_type]} · {formatDateRange(request)}
                    </span>
                  </span>
                </button>
                <AgingBadge request={request} />
                {/* En móvil la fila entera abre el detalle: dos botones no entran sin apretar el objetivo táctil. */}
                <div className="hidden shrink-0 gap-2 sm:flex">
                  <Button
                    loading={workingId === request.id}
                    onClick={() => void approve(request.id)}
                  >
                    Aprobar
                  </Button>
                  <Button
                    disabled={workingId === request.id}
                    variant="secondary"
                    onClick={() => navigate(`/admin/requests/${request.id}`)}
                  >
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-[var(--color-muted)]">
          {stats ? `Aprobación 30 d: ${stats.approvalRate30d}%.` : "Sin datos de aprobación todavía."}
          {pending.length > PREVIEW_COUNT ? ` ${pending.length - PREVIEW_COUNT} más en la cola.` : ""}
        </p>
      </div>

      <aside aria-label="Indicadores" className="flex flex-col bg-[var(--card-muted)]">
        {metrics.map((metric) => (
          <button
            className="press flex items-center gap-3 border-b border-[var(--card-border)] p-4 text-left"
            key={metric.key}
            type="button"
            onClick={() => navigate(metric.to)}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                {metric.label}
              </span>
              <span className="block text-2xl font-bold">{metric.value}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--color-muted)]" />
          </button>
        ))}
        <button
          className="press mt-auto flex items-center justify-center gap-2 border-t border-[var(--card-border)] p-4 text-xs font-bold text-[var(--color-muted)]"
          type="button"
          onClick={onCustomize}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Personalizar
        </button>
      </aside>
    </section>
  );
}
