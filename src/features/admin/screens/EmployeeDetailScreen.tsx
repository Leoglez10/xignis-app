import { ArrowLeft, ChevronRight, Clock, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
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
  grantAccess,
  hasRealEmail,
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
  const [granting, setGranting] = useState(false);
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
      <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 md:px-8 lg:max-w-5xl">
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
                <h2 className="truncate text-2xl font-bold md:text-3xl">{sheet.full_name}</h2>
                <p className="truncate text-sm text-[var(--color-muted)]">{sheet.job_title ?? "Sin puesto"}</p>
                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-muted)]">
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

        <div className="lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="space-y-4 lg:sticky lg:top-8">
            {sheet ? <ProfileSheet defs={defs} sheet={sheet} /> : null}
            {employee ? (
              <Button className="w-full" type="button" onClick={() => setEditing(true)}>
                Editar datos base
              </Button>
            ) : null}
            {sheet && !hasRealEmail(sheet.email) ? (
              <Button className="w-full" type="button" variant="secondary" onClick={() => setGranting(true)}>
                Dar acceso a la app
              </Button>
            ) : null}
          </div>

          <div className="mt-4 space-y-4 lg:mt-0">
          {sheet ? (
            <CustomFieldsEditor defs={defs} targetId={sheet.id} values={sheet.custom} onSaved={handleSaved} />
          ) : null}

          <section
            aria-labelledby="leave-history-title"
            className="rounded-[20px] bg-white p-5 ring-1 ring-slate-200"
          >
            <div className="mb-4 flex items-center gap-2">
              <Clock aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
              <h2 className="text-base font-bold" id="leave-history-title">Historial de vacaciones y permisos</h2>
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
                        <span className="block truncate text-sm font-bold">{leaveTypeLabel[request.leave_type]}</span>
                        <span className="mt-1 block text-xs text-[var(--color-muted)]">
                          {formatDateRangeEs(request.start_date, request.end_date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone[request.status]}`}>
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
              <h2 className="text-base font-bold" id="employment-history-title">Historial laboral</h2>
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
          </div>
        </div>
      </div>

      <EditSheet
        departments={departments}
        managers={managers}
        target={editing ? employee : null}
        onClose={() => setEditing(false)}
        onSaved={handleBaseSaved}
      />

      {sheet ? (
        <GrantAccessSheet
          isOpen={granting}
          name={sheet.full_name}
          userId={sheet.id}
          onClose={() => setGranting(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </AdminShell>
  );
}

/** Asigna un correo real a un empleado sin cuenta y le manda el enlace de acceso. */
function GrantAccessSheet({
  isOpen,
  name,
  userId,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  name: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("El correo no es válido.");
      return;
    }
    try {
      setSaving(true);
      await grantAccess({ user_id: userId, email: email.trim() });
      setDone(true);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo dar acceso.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setEmail("");
    setError(null);
    setDone(false);
    onClose();
  }

  return (
    <BottomSheet isOpen={isOpen} title="Dar acceso a la app" onClose={handleClose}>
      <div className="min-w-0 space-y-4">
        {done ? (
          <>
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Listo. Se envió a {email} un correo para definir su password y entrar a la app.
            </p>
            <Button className="w-full" type="button" onClick={handleClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-muted)]">
              Asigna un correo a <span className="font-bold text-[var(--color-text)]">{name}</span>. Se le enviará un
              enlace para definir su password y acceder.
            </p>
            <TextInput label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            {error ? (
              <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <Button className="w-full" disabled={saving} onClick={handleSubmit}>
              {saving ? "Enviando…" : "Enviar acceso"}
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
