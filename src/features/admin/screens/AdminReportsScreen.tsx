import { useEffect, useMemo, useState } from "react";
import {
  leaveTypeLabel,
  listHrLeaveRequests,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { AdminShell } from "../components/adminNav";

const statusTone: Record<string, string> = {
  approved: "bg-emerald-500",
  approved_by_manager: "bg-sky-500",
  cancelled: "bg-slate-400",
  pending_hr: "bg-amber-500",
  pending_manager: "bg-orange-400",
  rejected: "bg-red-500",
  rejected_by_manager: "bg-red-400",
};

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-black text-[var(--color-muted)]">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AdminReportsScreen() {
  const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listHrLeaveRequests()
      .then(setRequests)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los datos."))
      .finally(() => setIsLoading(false));
  }, []);

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of requests) counts.set(request.leave_type, (counts.get(request.leave_type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const total = requests.length;
  const approved = requests.filter((request) => request.status === "approved").length;
  const pending = requests.filter((request) => ["pending_hr", "approved_by_manager"].includes(request.status)).length;
  const approvalRate = total === 0 ? 0 : Math.round((approved / total) * 100);

  return (
    <AdminShell>
      <section className="p-4 md:p-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
          <h1 className="mt-1 text-3xl font-black md:text-4xl">Reportes</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {isLoading ? "Cargando datos." : "Resumen de solicitudes de toda la organizacion."}
          </p>
        </header>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <section className="animate-fade-up stagger mb-5 grid gap-3 sm:grid-cols-3" aria-label="Indicadores">
          {[
            ["Total", String(total), "bg-white"],
            ["Pendientes", String(pending), "bg-amber-50"],
            ["Tasa aprobacion", `${approvalRate}%`, "bg-emerald-50"],
          ].map(([label, value, tone]) => (
            <article className={`rounded-[20px] p-5 ring-1 ring-slate-200 ${tone}`} key={label}>
              <p className="text-sm font-black text-[var(--color-muted)]">{label}</p>
              <p className="mt-2 text-4xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="animate-fade-up rounded-[24px] bg-white p-5 ring-1 ring-slate-200" aria-labelledby="rep-status">
            <h2 className="mb-4 text-xl font-black" id="rep-status">
              Por estado
            </h2>
            <div className="space-y-4">
              {byStatus.length === 0 && !isLoading ? (
                <p className="text-sm text-[var(--color-muted)]">Sin datos todavia.</p>
              ) : null}
              {byStatus.map(([status, value]) => (
                <Bar
                  key={status}
                  label={statusLabel[status as keyof typeof statusLabel] ?? status}
                  tone={statusTone[status] ?? "bg-slate-500"}
                  total={total}
                  value={value}
                />
              ))}
            </div>
          </section>

          <section className="animate-fade-up rounded-[24px] bg-white p-5 ring-1 ring-slate-200" aria-labelledby="rep-type">
            <h2 className="mb-4 text-xl font-black" id="rep-type">
              Por tipo de permiso
            </h2>
            <div className="space-y-4">
              {byType.length === 0 && !isLoading ? (
                <p className="text-sm text-[var(--color-muted)]">Sin datos todavia.</p>
              ) : null}
              {byType.map(([type, value]) => (
                <Bar
                  key={type}
                  label={leaveTypeLabel[type as keyof typeof leaveTypeLabel] ?? type}
                  tone="bg-[var(--color-primary)]"
                  total={total}
                  value={value}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </AdminShell>
  );
}
