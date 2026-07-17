import { ArrowLeft, ChevronRight, Clock, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { formatDateRangeEs } from "../../../lib/date";
import type { Department } from "../../../lib/database.types";
import { usePageTitle } from "../../../lib/usePageTitle";
import { AdminShell } from "../components/adminNav";
import { CustomFieldsEditor } from "../../profiles/components/CustomFieldsEditor";
import { EmploymentTimeline } from "../../profiles/components/EmploymentTimeline";
import { ProfileSheet } from "../../profiles/components/ProfileSheet";
import { useProfileSheet } from "../../profiles/hooks/useProfileSheet";
import {
  getEmployeeProfile,
  listEmploymentEvents,
  listManagers,
  roleLabel,
  type ProfileWithManager,
} from "../../profiles/services/profileService";
import { listActiveDepartments } from "../services/departmentService";
import { EditSheet } from "./EmployeesScreen";
import { statusTone } from "../../leave-requests/config";
import {
  leaveTypeLabel,
  listEmployeeLeaveRequests,
  statusLabel,
} from "../../leave-requests/services/leaveRequestService";

/** Ficha de un empleado para RH/admin: datos completos + edición de datos base
 *  (EditSheet reusado) y de campos personalizados. */
export function EmployeeDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const sheetQuery = useProfileSheet(id);
  const [employee, setEmployee] = useState<ProfileWithManager | null>(null);
  const [managers, setManagers] = useState<Awaited<ReturnType<typeof listManagers>>>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestsQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => listEmployeeLeaveRequests(id!),
    queryKey: ["leave-requests", "employee", id],
  });
  const employmentEventsQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => listEmploymentEvents(id!),
    queryKey: ["employment-events", id],
  });

  usePageTitle(employee?.full_name ?? "Empleado");

  async function loadEmployee() {
    if (!id) return;
    try {
      const [emp, mgrs, deps] = await Promise.all([getEmployeeProfile(id), listManagers(), listActiveDepartments()]);
      setEmployee(emp);
      setManagers(mgrs);
      setDepartments(deps);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el empleado.");
    }
  }

  useEffect(() => {
    void loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sheet = sheetQuery.data?.sheet ?? null;
  const defs = sheetQuery.data?.defs ?? [];

  async function handleSaved() {
    await Promise.all([loadEmployee(), sheetQuery.refetch()]);
  }

  async function handleBaseSaved() {
    setEditing(false);
    await Promise.all([loadEmployee(), sheetQuery.refetch(), employmentEventsQuery.refetch()]);
  }

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
          <button
            aria-label="Regresar a Empleados"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/admin/employees")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          {sheet ? (
            <div className="flex flex-1 items-center gap-3">
              <Avatar className="text-base text-emerald-700" name={sheet.full_name} size="size-16" src={sheet.avatar_url} />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black md:text-3xl">{sheet.full_name}</h2>
                <p className="truncate text-sm text-[var(--color-muted)]">{sheet.job_title ?? "Sin puesto"}</p>
                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-[var(--color-muted)]">
                  {roleLabel[sheet.role]}
                </span>
              </div>
            </div>
          ) : null}
        </header>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {sheetQuery.isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando…</p>
        ) : null}

        {sheetQuery.isError ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            No se pudo cargar la ficha del empleado. El historial disponible se muestra a continuación.
          </p>
        ) : null}

        <div className="space-y-4">
          {sheet ? (
            <>
              <ProfileSheet defs={defs} sheet={sheet} />
              <CustomFieldsEditor defs={defs} targetId={sheet.id} values={sheet.custom} onSaved={handleSaved} />
            </>
          ) : null}

          <section
            aria-labelledby="leave-history-title"
            className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <Clock aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
              <h2 className="text-base font-black" id="leave-history-title">Historial de vacaciones y permisos</h2>
            </div>

            {requestsQuery.isLoading ? (
              <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando solicitudes…</p>
            ) : requestsQuery.isError ? (
              <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                No se pudo cargar el historial de solicitudes.
              </p>
            ) : (
              <ul className="space-y-2">
                {(requestsQuery.data ?? []).length === 0 ? (
                  <li className="rounded-2xl bg-[var(--color-surface)] p-5 text-center text-sm font-semibold text-[var(--color-muted)]">
                    Sin solicitudes registradas.
                  </li>
                ) : null}
                {(requestsQuery.data ?? []).map((request) => (
                  <li key={request.id}>
                    <button
                      className="press flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface)] p-4 text-left ring-1 ring-slate-200"
                      type="button"
                      onClick={() => navigate(`/admin/requests/${request.id}`)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{leaveTypeLabel[request.leave_type]}</span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {formatDateRangeEs(request.start_date, request.end_date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusTone[request.status]}`}>
                          {statusLabel[request.status]}
                        </span>
                        <ChevronRight aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="employment-history-title"
            className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <History aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
              <h2 className="text-base font-black" id="employment-history-title">Historial laboral</h2>
            </div>
            {employmentEventsQuery.isLoading ? (
              <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando historial laboral…</p>
            ) : employmentEventsQuery.isError ? (
              <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                No se pudo cargar el historial laboral.
              </p>
            ) : (
              <EmploymentTimeline events={employmentEventsQuery.data ?? []} />
            )}
          </section>

          {employee ? (
            <Button className="w-full" type="button" onClick={() => setEditing(true)}>
              Editar datos base
            </Button>
          ) : null}
        </div>
      </div>

      <EditSheet
        departments={departments}
        managers={managers}
        target={editing ? employee : null}
        onClose={() => setEditing(false)}
        onSaved={handleBaseSaved}
      />
    </AdminShell>
  );
}
