import { Download, FileDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateRangeEs } from "../../../lib/date";
import type { Department, LeaveStatus, LeaveType } from "../../../lib/database.types";
import { statusTone as statusChipTone } from "../../leave-requests/config";
import {
  leaveTypeLabel,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";
import { AdminShell } from "../components/adminNav";
import { Select } from "../../../components/ui/Select";
import { DateInput as UiDateInput } from "../../../components/ui/DateInput";
import { DepartmentBreakdown } from "../components/DepartmentBreakdown";
import { listActiveDepartments } from "../services/departmentService";
import { useLeaveRequests } from "../../leave-requests/hooks/useLeaveRequests";

const statusTone: Record<string, string> = {
  approved: "bg-emerald-500",
  approved_by_manager: "bg-indigo-500",
  cancelled: "bg-slate-400",
  pending_hr: "bg-amber-500",
  pending_manager: "bg-orange-400",
  rejected: "bg-red-500",
  rejected_by_manager: "bg-red-400",
};

const allStatuses: LeaveStatus[] = [
  "pending_manager",
  "approved_by_manager",
  "pending_hr",
  "approved",
  "rejected",
  "rejected_by_manager",
  "cancelled",
];
const allTypes: LeaveType[] = ["vacation", "personal", "sick", "other"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function dayCount(start: string, end: string) {
  const startMs = new Date(`${start}T00:00:00`).getTime();
  const endMs = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
}

function approvalDays(request: LeaveRequestWithEmployee) {
  if (!request.reviewed_at) return null;
  const created = new Date(request.created_at).getTime();
  const reviewed = new Date(request.reviewed_at).getTime();
  if (Number.isNaN(created) || Number.isNaN(reviewed)) return null;
  return Math.max(0, Math.round((reviewed - created) / 86_400_000));
}

function exportCsv(rows: LeaveRequestWithEmployee[]) {
  const header = ["Empleado", "Puesto", "Tipo", "Inicio", "Fin", "Dias", "Estado", "Enviada", "Revisada"];
  const body = rows.map((request) => [
    request.employee?.full_name ?? "",
    request.employee?.job_title ?? "",
    leaveTypeLabel[request.leave_type],
    request.start_date,
    request.end_date,
    dayCount(request.start_date, request.end_date),
    statusLabel[request.status],
    new Date(request.created_at).toLocaleString(),
    request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : "",
  ]);
  const csv = [header, ...body]
    .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `xignis-reportes-${todayISO()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(rows: LeaveRequestWithEmployee[]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text("Reporte de permisos · Xignis", 14, 18);
  doc.setFontSize(9);
  doc.text(`Generado ${new Date().toLocaleString("es-MX")} · ${rows.length} registros`, 14, 25);
  autoTable(doc, {
    head: [["Empleado", "Puesto", "Tipo", "Fechas", "Días", "Goce", "Estado"]],
    body: rows.map((request) => [request.employee?.full_name ?? "", request.employee?.job_title ?? "", leaveTypeLabel[request.leave_type], formatDateRangeEs(request.start_date, request.end_date), dayCount(request.start_date, request.end_date), request.paid ? "Sí" : "No", statusLabel[request.status]]),
    margin: { top: 31 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [7, 80, 48] },
  });
  doc.save(`xignis-reportes-${todayISO()}.pdf`);
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-bold text-[var(--color-muted)]">
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
  const requestsQuery = useLeaveRequests("hr");
  const departmentsQuery = useQuery<Department[]>({ queryKey: ["departments", "active"], queryFn: listActiveDepartments });
  const requests = (requestsQuery.data ?? []) as LeaveRequestWithEmployee[];
  const departments = departmentsQuery.data ?? [];
  const error = requestsQuery.error ?? departmentsQuery.error;
  const isLoading = requestsQuery.isLoading || departmentsQuery.isLoading;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | LeaveType>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState(monthStartISO);
  const [endDate, setEndDate] = useState(todayISO);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (startDate && request.start_date < startDate) return false;
      if (endDate && request.start_date > endDate) return false;
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (typeFilter !== "all" && request.leave_type !== typeFilter) return false;
      if (deptFilter !== "all" && request.employee?.department_id !== deptFilter) return false;
      if (q) {
        const haystack = [request.employee?.full_name, request.employee?.job_title, statusLabel[request.status], leaveTypeLabel[request.leave_type]]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [deptFilter, endDate, query, requests, startDate, statusFilter, typeFilter]);

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of filtered) counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const request of filtered) counts.set(request.leave_type, (counts.get(request.leave_type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const total = filtered.length;
  const approved = filtered.filter((request) => request.status === "approved").length;
  const rejected = filtered.filter((request) => request.status === "rejected" || request.status === "rejected_by_manager").length;
  const pending = filtered.filter((request) => ["pending_hr", "approved_by_manager", "pending_manager"].includes(request.status)).length;
  const approvalRate = total === 0 ? 0 : Math.round((approved / total) * 100);
  const rejectionRate = total === 0 ? 0 : Math.round((rejected / total) * 100);
  const approvedDays = filtered
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + dayCount(request.start_date, request.end_date), 0);
  const approvalDurations = filtered.map(approvalDays).filter((value): value is number => value !== null);
  const averageApprovalDays = approvalDurations.length === 0
    ? "-"
    : `${Math.round(approvalDurations.reduce((sum, value) => sum + value, 0) / approvalDurations.length)}d`;
  const recentRows = filtered.slice(0, 8);

  return (
    <AdminShell>
      <section className="p-4 md:p-6">
        <header className="animate-fade-up mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="mt-1 text-3xl font-bold md:text-4xl">Reportes</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {isLoading ? "Cargando datos." : `${total} solicitudes en el periodo filtrado.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row"><button
            className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
            disabled={filtered.length === 0}
            type="button"
            onClick={() => exportCsv(filtered)}
          >
            <Download aria-hidden="true" className="size-4" />
            Exportar CSV
          </button><button className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--card-bg)] px-5 text-sm font-bold disabled:opacity-50 sm:w-auto" disabled={filtered.length === 0} type="button" onClick={() => void exportPdf(filtered)}><FileDown aria-hidden="true" className="size-4" />Exportar PDF</button></div>
        </header>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error instanceof Error ? error.message : "No se pudieron cargar los datos."}
          </p>
        ) : null}

        <section className="animate-fade-up mb-5 rounded-[24px] bg-white p-4 ring-1 ring-slate-200" aria-label="Filtros de reportes">
          <div className="grid gap-3 md:grid-cols-[1fr_repeat(5,auto)] md:items-end">
            <label className="block min-w-0 space-y-2">
              <span className="text-xs font-bold text-[var(--color-muted)]">Buscar</span>
              <span className="relative block">
                <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="h-11 w-full rounded-full bg-slate-50 pl-11 pr-4 text-sm outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                  placeholder="Empleado, puesto, estado"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
            </label>
            <ReportSelect label="Estado" value={statusFilter} onChange={(value) => setStatusFilter(value as "all" | LeaveStatus)}>
              <option value="all">Todos</option>
              {allStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
            </ReportSelect>
            <ReportSelect label="Tipo" value={typeFilter} onChange={(value) => setTypeFilter(value as "all" | LeaveType)}>
              <option value="all">Todos</option>
              {allTypes.map((type) => <option key={type} value={type}>{leaveTypeLabel[type]}</option>)}
            </ReportSelect>
            <ReportSelect label="Área" value={deptFilter} onChange={setDeptFilter}>
              <option value="all">Todas</option>
              {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </ReportSelect>
            <DateInput label="Desde" value={startDate} onChange={setStartDate} />
            <DateInput label="Hasta" value={endDate} onChange={setEndDate} />
          </div>
        </section>

        <section className="animate-fade-up stagger mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores">
          {[
            ["Total", String(total), "bg-white"],
            ["Pendientes", String(pending), "bg-amber-50"],
            ["Tasa aprobacion", `${approvalRate}%`, "bg-emerald-50"],
            ["Tasa rechazo", `${rejectionRate}%`, "bg-red-50"],
            ["Dias aprobados", String(approvedDays), "bg-sky-50"],
            ["Prom. revision", averageApprovalDays, "bg-indigo-50"],
          ].map(([label, value, tone]) => (
            <article className={`rounded-[20px] p-5 ring-1 ring-slate-200 ${tone}`} key={label}>
              <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="animate-fade-up rounded-[24px] bg-white p-5 ring-1 ring-slate-200" aria-labelledby="rep-status">
            <h2 className="mb-4 text-xl font-bold" id="rep-status">
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
            <h2 className="mb-4 text-xl font-bold" id="rep-type">
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

        <DepartmentBreakdown departments={departments} requests={filtered} />

        <section className="animate-fade-up mt-4 rounded-[24px] bg-white p-5 ring-1 ring-slate-200" aria-labelledby="report-table">
          <h2 className="mb-4 text-xl font-bold" id="report-table">Detalle filtrado</h2>
          {recentRows.length === 0 && !isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">Sin solicitudes para estos filtros.</p>
          ) : null}
          <div className="space-y-3 md:hidden">
            {recentRows.map((request) => {
              const duration = approvalDays(request);
              return (
                <article className="rounded-[20px] bg-slate-50 p-4 ring-1 ring-slate-200" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{request.employee?.full_name ?? "Empleado"}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{request.employee?.job_title ?? "Sin puesto"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusChipTone[request.status]}`}>
                      {statusLabel[request.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-muted)]">Tipo</p>
                      <p className="mt-1 font-bold">{leaveTypeLabel[request.leave_type]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-muted)]">Dias</p>
                      <p className="mt-1 font-bold">{dayCount(request.start_date, request.end_date)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-[var(--color-muted)]">Periodo</p>
                      <p className="mt-1 font-bold">{formatDateRangeEs(request.start_date, request.end_date)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-[var(--color-muted)]">Revision</p>
                      <p className="mt-1 font-bold">{duration === null ? "Pendiente" : `${duration}d`}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="w-[28%] pb-3 pr-4">Empleado</th>
                  <th className="w-[15%] pb-3 pr-4">Tipo</th>
                  <th className="w-[18%] pb-3 pr-4">Periodo</th>
                  <th className="w-[8%] pb-3 pr-4">Dias</th>
                  <th className="w-[20%] pb-3 pr-4">Estado</th>
                  <th className="w-[11%] pb-3">Revision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRows.map((request) => {
                  const duration = approvalDays(request);
                  return (
                    <tr key={request.id}>
                      <td className="py-3 pr-4">
                        <p className="truncate font-bold">{request.employee?.full_name ?? "Empleado"}</p>
                        <p className="truncate text-xs text-[var(--color-muted)]">{request.employee?.job_title ?? "Sin puesto"}</p>
                      </td>
                      <td className="truncate py-3 pr-4 font-bold">{leaveTypeLabel[request.leave_type]}</td>
                      <td className="py-3 pr-4 text-[var(--color-muted)]">{formatDateRangeEs(request.start_date, request.end_date)}</td>
                      <td className="py-3 pr-4 font-bold">{dayCount(request.start_date, request.end_date)}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusChipTone[request.status]}`}>
                          {statusLabel[request.status]}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--color-muted)]">{duration === null ? "Pendiente" : `${duration}d`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > recentRows.length ? (
            <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">
              Mostrando {recentRows.length} de {filtered.length}. Exporta CSV para ver todo.
            </p>
          ) : null}
        </section>
      </section>
    </AdminShell>
  );
}

function ReportSelect({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return <Select className="h-11 rounded-full text-sm font-bold md:w-40" label={label} value={value} onChange={(event) => onChange(event.target.value)}>{children}</Select>;
}

function DateInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <UiDateInput className="h-11 rounded-full text-sm font-bold md:w-36" label={label} value={value} onChange={(event) => onChange(event.target.value)} />;
}
