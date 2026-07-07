import { CheckCircle2, Download, Search, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { NotificationBell } from "../../notifications/NotificationBell";
import { AdminBottomNav, AdminSidebar } from "../components/adminNav";
import {
  formatDateRange,
  leaveTypeLabel,
  listHrLeaveRequests,
  reviewLeaveRequest,
  statusLabel,
  type LeaveRequestWithEmployee,
} from "../../leave-requests/services/leaveRequestService";

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null;
  const kpis = useMemo(
    () => [
      {
        color: "bg-white",
        label: "Pendientes",
        value: String(requests.filter((request) => ["pending_hr", "approved_by_manager"].includes(request.status)).length),
      },
      { color: "bg-emerald-50", label: "Aprobadas", value: String(requests.filter((request) => request.status === "approved").length) },
      { color: "bg-orange-50", label: "Rechazadas", value: String(requests.filter((request) => request.status === "rejected").length) },
    ],
    [requests],
  );

  async function loadRequests() {
    try {
      const data = await listHrLeaveRequests();
      setRequests(data);
      setSelectedRequestId((current) => current ?? data[0]?.id ?? null);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleReview(id: string, decision: "approved" | "rejected") {
    try {
      setActionId(id);
      await reviewLeaveRequest({ comment, decision, id, reviewerRole: "hr_admin" });
      setComment("");
      await loadRequests();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="grid min-h-dvh bg-white md:grid-cols-[236px_1fr]">
        <AdminSidebar />

        <section className="grid gap-5 bg-slate-50 p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] md:grid-cols-[1fr_340px] md:p-6 md:pb-6">
          <div className="min-w-0">
            <header className="animate-fade-up mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">Panel de permisos</h1>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {isLoading ? "Cargando solicitudes." : "Solicitudes sincronizadas con Supabase."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <button
                    className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[var(--color-text)] ring-1 ring-slate-200 md:hidden"
                    onClick={() => navigate("/admin/employees")}
                    type="button"
                  >
                    <Users aria-hidden="true" className="size-4" />
                    Empleados
                  </button>
                  <NotificationBell />
                </div>
                <label className="relative block sm:w-72">
                  <span className="sr-only">Buscar solicitudes</span>
                  <Search
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]"
                  />
                  <input
                    className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                    placeholder="Buscar empleado"
                    type="search"
                  />
                </label>
                <Button className="min-h-12 px-5" variant="secondary">
                  <Download aria-hidden="true" className="size-4" />
                  Exportar
                </Button>
              </div>
            </header>

            <section className="animate-fade-up stagger mb-5 grid gap-3 md:grid-cols-3" aria-label="Indicadores RH">
              {kpis.map((kpi) => (
                <article className={`rounded-[20px] p-5 shadow-sm ring-1 ring-slate-200 ${kpi.color}`} key={kpi.label}>
                  <p className="text-sm font-black text-[var(--color-muted)]">{kpi.label}</p>
                  <p className="mt-2 text-4xl font-black">{kpi.value}</p>
                </article>
              ))}
            </section>

            <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black">Solicitudes recientes</h2>
                <div aria-label="Filtro de solicitudes" className="flex gap-2" role="group">
                  {["Todas", "Pendientes", "Aprobadas"].map((filter) => (
                    <button
                      aria-pressed={filter === "Pendientes"}
                      className={`rounded-full px-3 py-2 text-xs font-black ${
                        filter === "Pendientes" ? "bg-slate-950 text-white" : "bg-slate-100 text-[var(--color-muted)]"
                      }`}
                      key={filter}
                      type="button"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                {error ? (
                  <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                  <thead>
                    <tr className="text-xs uppercase text-[var(--color-muted)]">
                      <th className="px-4 py-2 font-black">Empleado</th>
                      <th className="px-4 py-2 font-black">Tipo</th>
                      <th className="px-4 py-2 font-black">Fechas</th>
                      <th className="px-4 py-2 font-black">Estado</th>
                      <th className="px-4 py-2 text-right font-black">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 && !isLoading ? (
                      <tr>
                        <td className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-[var(--color-muted)]" colSpan={5}>
                          No hay solicitudes para revisar.
                        </td>
                      </tr>
                    ) : null}
                    {requests.map((request) => (
                      <tr className="bg-slate-50" key={request.id}>
                        <td className="rounded-l-2xl px-4 py-4">
                          <button className="text-left" type="button" onClick={() => setSelectedRequestId(request.id)}>
                            <p className="font-black">{request.employee?.full_name ?? "Empleado"}</p>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">{request.employee?.job_title ?? "Sin puesto"}</p>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold">{leaveTypeLabel[request.leave_type]}</td>
                        <td className="px-4 py-4 text-sm font-semibold">{formatDateRange(request)}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              request.status === "pending_hr" || request.status === "approved_by_manager"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {statusLabel[request.status]}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              aria-label={`Aprobar solicitud de ${request.employee?.full_name ?? "empleado"}`}
                              className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"
                              disabled={actionId === request.id}
                              type="button"
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                handleReview(request.id, "approved");
                              }}
                            >
                              <CheckCircle2 aria-hidden="true" className="size-5" />
                            </button>
                            <button
                              aria-label={`Rechazar solicitud de ${request.employee?.full_name ?? "empleado"}`}
                              className="grid size-10 place-items-center rounded-full bg-red-50 text-red-700"
                              disabled={actionId === request.id}
                              type="button"
                              onClick={() => {
                                setSelectedRequestId(request.id);
                                handleReview(request.id, "rejected");
                              }}
                            >
                              <XCircle aria-hidden="true" className="size-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-labelledby="review-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[var(--color-muted)]">Revision</p>
                <h2 className="mt-1 text-2xl font-black" id="review-title">
                  Solicitud pendiente
                </h2>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                {selectedRequest ? statusLabel[selectedRequest.status] : "Sin seleccion"}
              </span>
            </div>

            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                {(selectedRequest?.employee?.full_name ?? "X")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-black">{selectedRequest?.employee?.full_name ?? "Sin solicitud"}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{selectedRequest?.employee?.job_title ?? "Sin puesto"}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-black uppercase text-[var(--color-muted)]">Fechas</dt>
                <dd className="mt-2 text-lg font-black">{selectedRequest ? formatDateRange(selectedRequest) : "-"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-black uppercase text-[var(--color-muted)]">Horario</dt>
                <dd className="mt-2 text-lg font-black">
                  {selectedRequest?.schedule_type === "time_range"
                    ? `${selectedRequest.start_time} - ${selectedRequest.end_time}`
                    : "Completo"}
                </dd>
              </div>
            </dl>

            <section className="mt-4 rounded-2xl bg-slate-50 p-4" aria-labelledby="admin-pending-tasks">
              <h3 className="text-sm font-black" id="admin-pending-tasks">
                Actividades pendientes
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {selectedRequest?.pending_tasks || "Sin actividades capturadas."}
              </p>
            </section>

            <label className="mt-4 block">
              <span className="text-sm font-black">Comentario interno</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl bg-slate-50 p-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                placeholder="Opcional para auditoria o seguimiento"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>

            <div className="mt-5 grid gap-3">
              <Button
                className="press w-full"
                disabled={!selectedRequest || actionId === selectedRequest.id}
                onClick={() => selectedRequest && handleReview(selectedRequest.id, "approved")}
              >
                <CheckCircle2 aria-hidden="true" className="size-5" />
                Aprobar
              </Button>
              <Button
                className="press w-full border-red-200 text-red-700"
                disabled={!selectedRequest || actionId === selectedRequest.id}
                variant="secondary"
                onClick={() => selectedRequest && handleReview(selectedRequest.id, "rejected")}
              >
                <XCircle aria-hidden="true" className="size-5" />
                Rechazar
              </Button>
            </div>
          </aside>
        </section>
      </div>
      <AdminBottomNav />
    </main>
  );
}
