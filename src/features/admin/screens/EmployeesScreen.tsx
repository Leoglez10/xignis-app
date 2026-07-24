import { Avatar } from "../../../components/ui/Avatar";
import { ArrowLeft, CalendarDays, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { DateInput } from "../../../components/ui/DateInput";
import { TextInput } from "../../../components/ui/TextInput";
import type { Department, EmploymentStatus, Profile, SeparationType, UserRole } from "../../../lib/database.types";
import { AdminShell } from "../components/adminNav";
import {
  deleteEmployee,
  inviteUser,
  listEmployees,
  listManagers,
  roleLabel,
  updateProfileAssignment,
  type ProfileWithManager,
} from "../../profiles/services/profileService";
import { listActiveDepartments } from "../services/departmentService";
import { areaColor } from "../areaColor";

/** Bucket key for employees with no department assigned. */
const NO_AREA = "__no_area__";

const separationLabel: Record<SeparationType, string> = {
  voluntary: "Renuncia voluntaria",
  involuntary: "Baja involuntaria",
  end_contract: "Fin de contrato",
  relocation: "Reubicación",
  retirement: "Jubilación",
  other: "Otro",
};

type StatusFilter = "active" | "terminated" | "all";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Activos" },
  { key: "terminated", label: "Bajas" },
  { key: "all", label: "Todos" },
];

function matchesStatus(status: EmploymentStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "terminated") return status === "terminated" || status === "archived";
  return status === "active" || status === "on_leave";
}

const roleBadge: Record<UserRole, string> = {
  admin: "bg-slate-900 text-white",
  hr_admin: "bg-indigo-100 text-indigo-800",
  manager: "bg-blue-100 text-blue-800",
  employee: "bg-emerald-100 text-emerald-800",
};

const roleOptions: UserRole[] = ["employee", "manager", "hr_admin", "admin"];

export function EmployeesScreen() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<ProfileWithManager[]>([]);
  const [managers, setManagers] = useState<Pick<Profile, "id" | "full_name" | "role">[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProfileWithManager | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileWithManager | null>(null);

  const byStatus = useMemo(
    () => employees.filter((e) => matchesStatus(e.employment_status, statusFilter)),
    [employees, statusFilter],
  );

  const bySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (e) => e.full_name.toLowerCase().includes(q) || (e.job_title ?? "").toLowerCase().includes(q),
    );
  }, [byStatus, query]);

  // Chips come from byStatus so the rail stays stable while typing; counts come
  // from bySearch so they reflect what is actually on screen.
  const areas = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const e of byStatus) {
      const id = e.department_id ?? NO_AREA;
      if (!map.has(id)) map.set(id, { id, name: e.department?.name ?? "Sin área", count: 0 });
    }
    for (const e of bySearch) {
      const area = map.get(e.department_id ?? NO_AREA);
      if (area) area.count += 1;
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === NO_AREA) return 1;
      if (b.id === NO_AREA) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [byStatus, bySearch]);

  const filtered = useMemo(
    () => (areaFilter ? bySearch.filter((e) => (e.department_id ?? NO_AREA) === areaFilter) : bySearch),
    [bySearch, areaFilter],
  );

  // Colors picked by HR win over the derived tone, so the rail matches Áreas.
  const colorByArea = useMemo(() => new Map(departments.map((d) => [d.id, d.color])), [departments]);

  // Group the visible employees under their area so the list reads as
  // "Sistemas → gente → Sin área → gente" instead of one flat wall of cards.
  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; members: ProfileWithManager[] }>();
    for (const e of filtered) {
      const id = e.department_id ?? NO_AREA;
      if (!map.has(id)) map.set(id, { id, name: e.department?.name ?? "Sin área", members: [] });
      map.get(id)!.members.push(e);
    }
    return [...map.values()].sort((a, b) => {
      if (a.id === NO_AREA) return 1;
      if (b.id === NO_AREA) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  async function load() {
    try {
      const emps = await listEmployees().catch((loadError) => {
        throw new Error(`Empleados: ${loadError instanceof Error ? loadError.message : "No se pudieron cargar."}`);
      });
      const mgrs = await listManagers().catch((loadError) => {
        throw new Error(`Jefes: ${loadError instanceof Error ? loadError.message : "No se pudieron cargar."}`);
      });
      const depts = await listActiveDepartments().catch(() => [] as Department[]);
      setEmployees(emps);
      setManagers(mgrs);
      setDepartments(depts);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el directorio.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <div className="page-wrap py-5 md:py-8">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
          <button
            aria-label="Regresar al panel"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="text-2xl font-bold md:text-3xl">Empleados</h2>
          </div>
          <Button className="min-h-12 px-4" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden="true" className="mr-2 size-4" />
            Agregar
          </Button>
        </header>

        <label className="animate-fade-up relative mb-5 block md:max-w-md">
          <span className="sr-only">Buscar empleado</span>
          <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className="h-12 w-full rounded-full bg-white pl-11 pr-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
            placeholder="Buscar por nombre o puesto"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div aria-label="Filtro por estado de empleo" className="mb-4 flex flex-wrap gap-2" role="group">
          {STATUS_FILTERS.map((f) => (
            <button
              aria-pressed={statusFilter === f.key}
              className={`press rounded-full px-4 py-2 text-xs font-bold transition ${
                statusFilter === f.key ? "bg-slate-950 text-white" : "bg-white text-[var(--color-muted)] ring-1 ring-slate-200"
              }`}
              key={f.key}
              type="button"
              onClick={() => {
                setStatusFilter(f.key);
                setAreaFilter(null);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {areas.length > 1 ? (
          <div
            aria-label="Filtro por área"
            className="-mx-4 mb-5 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
            role="group"
          >
            {areas.map((area) => {
              const color = areaColor(area.id === NO_AREA ? null : area.id, colorByArea.get(area.id));
              const isActive = areaFilter === area.id;
              return (
                <button
                  aria-pressed={isActive}
                  className={`press flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-4 text-xs font-bold ring-1 transition-colors ${
                    isActive ? color.active : "bg-white text-[var(--color-text)] ring-slate-200"
                  } ${area.count === 0 && !isActive ? "opacity-40" : ""}`}
                  key={area.id}
                  type="button"
                  onClick={() => setAreaFilter(isActive ? null : area.id)}
                >
                  <span aria-hidden="true" className={`size-2 rounded-full ${color.dot}`} />
                  {area.name}
                  <span className="tabular-nums opacity-60">{area.count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando directorio…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
            Sin empleados que coincidan.
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => {
              const color = areaColor(group.id === NO_AREA ? null : group.id, colorByArea.get(group.id));
              return (
                <section key={group.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span aria-hidden="true" className={`size-2.5 rounded-full ${color.dot}`} />
                    <h3 className="text-sm font-bold">{group.name}</h3>
                    <span className="tabular-nums text-xs text-[var(--color-muted)]">{group.members.length}</span>
                  </div>
                  <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {group.members.map((emp) => (
                      <li
                        className="relative flex items-center gap-4 overflow-hidden rounded-[20px] bg-white p-4 pl-5 shadow-sm ring-1 ring-slate-200"
                        key={emp.id}
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute inset-y-0 left-0 w-1.5 ${
                            areaColor(emp.department_id, emp.department_id ? colorByArea.get(emp.department_id) : null).bar
                          }`}
                        />
                        <Avatar className="text-sm text-emerald-700" name={emp.full_name} size="size-12" src={emp.avatar_url} />
                        <button
                          className="press min-w-0 flex-1 text-left"
                          type="button"
                          onClick={() => navigate(`/admin/employees/${emp.id}`)}
                        >
                          <p className="truncate font-bold">{emp.full_name}</p>
                          <p className="truncate text-xs text-[var(--color-muted)]">{emp.job_title ?? "Sin puesto"}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${roleBadge[emp.role]}`}>
                              {roleLabel[emp.role]}
                            </span>
                            {emp.employment_status === "terminated" || emp.employment_status === "archived" ? (
                              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                Baja{emp.separation_type ? ` · ${separationLabel[emp.separation_type]}` : ""}
                              </span>
                            ) : null}
                            {emp.manager?.full_name ? (
                              <span className="text-[11px] text-[var(--color-muted)]">Jefe: {emp.manager.full_name}</span>
                            ) : null}
                            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              emp.annual_vacation_days === null ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              <CalendarDays aria-hidden="true" className="size-3" />
                              {emp.annual_vacation_days === null ? "Vacaciones no configuradas" : `${emp.annual_vacation_days} días/año`}
                            </span>
                          </div>
                        </button>
                        <button
                          aria-label={`Editar a ${emp.full_name}`}
                          className="press grid size-10 place-items-center rounded-full bg-slate-100 text-[var(--color-text)]"
                          type="button"
                          onClick={() => setEditTarget(emp)}
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          aria-label={`Dar de baja a ${emp.full_name}`}
                          className="press grid size-10 place-items-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100 disabled:opacity-40"
                          disabled={emp.employment_status === "terminated" || emp.employment_status === "archived"}
                          type="button"
                          onClick={() => setDeleteTarget(emp)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <InviteSheet
        departments={departments}
        isOpen={inviteOpen}
        managers={managers}
        onClose={() => setInviteOpen(false)}
        onSaved={async () => {
          setInviteOpen(false);
          await load();
        }}
      />

      <EditSheet
        departments={departments}
        managers={managers}
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          setEditTarget(null);
          await load();
        }}
      />

      <DeleteEmployeeSheet
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSaved={async () => {
          setDeleteTarget(null);
          await load();
        }}
      />
    </AdminShell>
  );
}

type ManagerOption = Pick<Profile, "id" | "full_name" | "role">;

export function InviteSheet({
  isOpen,
  managers,
  departments,
  defaultDepartmentId,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  managers: ManagerOption[];
  departments: Department[];
  /** Preselecciona el área al abrir desde la pantalla de Áreas. */
  defaultDepartmentId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [annualVacationDays, setAnnualVacationDays] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [managerId, setManagerId] = useState("");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setDepartmentId(defaultDepartmentId ?? "");
  }, [isOpen, defaultDepartmentId]);

  async function handleSubmit() {
    setError(null);
    if (!fullName.trim()) {
      setError("Falta el nombre.");
      return;
    }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("El correo no es válido.");
      return;
    }
    const parsedVacationDays = annualVacationDays.trim() === "" ? null : Number(annualVacationDays);
    if (parsedVacationDays !== null && (!Number.isInteger(parsedVacationDays) || parsedVacationDays < 0 || parsedVacationDays > 365)) {
      setError("Los días de vacaciones deben estar entre 0 y 365.");
      return;
    }
    try {
      setSaving(true);
      await inviteUser({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        job_title: jobTitle.trim() || null,
        manager_id: managerId || null,
        department_id: departmentId || null,
        annual_vacation_days: parsedVacationDays,
      });
      setEmail("");
      setFullName("");
      setJobTitle("");
      setAnnualVacationDays("");
      setRole("employee");
      setManagerId("");
      setDepartmentId(defaultDepartmentId ?? "");
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo invitar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} title="Agregar empleado" onClose={onClose}>
      <div className="min-w-0 space-y-4">
        <TextInput required label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextInput
          hint="Puedes omitirlo por ahora. Sin correo, la persona se registra sin cuenta (no recibe invitación); le das acceso después desde su perfil."
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput label="Puesto" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        <TextInput
          label="Días de vacaciones al año"
          inputMode="numeric"
          max={365}
          min={0}
          type="number"
          value={annualVacationDays}
          onChange={(e) => setAnnualVacationDays(e.target.value)}
        />
        <RoleSelect value={role} onChange={setRole} />
        <ManagerSelect managers={managers} value={managerId} onChange={setManagerId} />
        <DepartmentSelect departments={departments} value={departmentId} onChange={setDepartmentId} />

        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {email.trim() ? (
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Se enviará un correo de invitación. Al abrirlo, la persona define su password y entra a la app.
          </p>
        ) : null}

        <Button className="w-full" disabled={saving} onClick={handleSubmit}>
          {saving ? "Guardando…" : email.trim() ? "Enviar invitación" : "Agregar empleado"}
        </Button>
      </div>
    </BottomSheet>
  );
}

export function EditSheet({
  managers,
  departments,
  target,
  onClose,
  onSaved,
}: {
  managers: ManagerOption[];
  departments: Department[];
  target: ProfileWithManager | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<UserRole>("employee");
  const [managerId, setManagerId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [annualVacationDays, setAnnualVacationDays] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setRole(target.role);
      setManagerId(target.manager_id ?? "");
      setDepartmentId(target.department_id ?? "");
      setJobTitle(target.job_title ?? "");
      setAnnualVacationDays(target.annual_vacation_days === null ? "" : String(target.annual_vacation_days));
      setBirthDate(target.birth_date ?? "");
      setHireDate(target.hire_date ?? "");
      setError(null);
    }
  }, [target]);

  async function handleSubmit() {
    if (!target) return;
    try {
      const parsedVacationDays = annualVacationDays.trim() === "" ? null : Number(annualVacationDays);
      if (parsedVacationDays !== null && (!Number.isInteger(parsedVacationDays) || parsedVacationDays < 0 || parsedVacationDays > 365)) {
        setError("Los días de vacaciones deben estar entre 0 y 365.");
        return;
      }
      setSaving(true);
      await updateProfileAssignment(target.id, {
        role,
        manager_id: managerId || null,
        department_id: departmentId || null,
        job_title: jobTitle.trim() || null,
        annual_vacation_days: parsedVacationDays,
        birth_date: birthDate || null,
        hire_date: hireDate || null,
      });
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={Boolean(target)} title={target ? `Editar a ${target.full_name}` : "Editar"} onClose={onClose}>
      <div className="min-w-0 space-y-4">
        <TextInput label="Puesto" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        <TextInput
          label="Días de vacaciones al año"
          inputMode="numeric"
          max={365}
          min={0}
          type="number"
          value={annualVacationDays}
          onChange={(e) => setAnnualVacationDays(e.target.value)}
        />
        <RoleSelect value={role} onChange={setRole} />
        <DateInput label="Cumpleaños" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <DateInput label="Fecha de ingreso" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        <ManagerSelect
          managers={managers.filter((m) => m.id !== target?.id)}
          value={managerId}
          onChange={setManagerId}
        />
        <DepartmentSelect departments={departments} value={departmentId} onChange={setDepartmentId} />
        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" disabled={saving} onClick={handleSubmit}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </BottomSheet>
  );
}

function DeleteEmployeeSheet({
  target,
  onClose,
  onSaved,
}: {
  target: ProfileWithManager | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameInput, setNameInput] = useState("");
  const [ackDelete, setAckDelete] = useState(false);
  const [ackHistory, setAckHistory] = useState(false);
  const [separationType, setSeparationType] = useState<SeparationType>("voluntary");
  const [terminationReason, setTerminationReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setStep(1);
      setNameInput("");
      setAckDelete(false);
      setAckHistory(false);
      setSeparationType("voluntary");
      setTerminationReason("");
      setError(null);
    }
  }, [target]);

  if (!target) return null;

  const expectedName = target.full_name.trim();
  const nameMatches = nameInput.trim() === expectedName;
  const canDelete = ackDelete && ackHistory && nameMatches;

  async function handleDelete() {
    if (!target) return;
    try {
      setSaving(true);
      setError(null);
      await deleteEmployee({
        confirmation: nameInput.trim(),
        user_id: target.id,
        separation_type: separationType,
        termination_reason: terminationReason.trim() || null,
      });
      onSaved();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={Boolean(target)} title={`Dar de baja a ${target.full_name}`} onClose={onClose}>
      <div className="space-y-4">
        <ol className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
          {[1, 2, 3].map((current) => (
            <li
              className={`flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${
                current <= step ? "bg-red-50 text-red-700 ring-red-200" : "bg-slate-50 text-[var(--color-muted)] ring-slate-200"
              }`}
              key={current}
            >
              <span className="grid size-5 place-items-center rounded-full bg-white text-[10px] ring-1 ring-current">
                {current}
              </span>
              {current === 1 ? "Aviso" : current === 2 ? "Confirmar" : "Ejecutar"}
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[var(--color-text)]">
              Vas a dar de baja a <span className="font-bold">{target.full_name}</span>.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--color-muted)]">
              <li>Perderá el acceso a la app de inmediato.</li>
              <li>Su historial de solicitudes y datos se conservan para auditoría.</li>
              <li>Se registrará la razón de separación en su expediente.</li>
              <li>Si tenía empleados a cargo, quedarán sin jefe directo.</li>
            </ul>
            <Button className="w-full" onClick={() => setStep(2)}>
              Entiendo, continuar
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-medium text-[var(--color-text)]">Tipo de separación</span>
              <select
                className="h-13 w-full min-w-0 appearance-none rounded-2xl bg-[var(--color-surface)] px-4 text-base font-semibold text-[var(--color-text)] outline-none ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-[var(--color-focus)]"
                value={separationType}
                onChange={(event) => setSeparationType(event.target.value as SeparationType)}
              >
                {(Object.keys(separationLabel) as SeparationType[]).map((key) => (
                  <option key={key} value={key}>
                    {separationLabel[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-text)]">Razón de la baja (opcional)</span>
              <textarea
                className="mt-2 min-h-20 w-full resize-none rounded-2xl bg-[var(--color-surface)] p-4 text-sm outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[var(--color-focus)]"
                placeholder="Detalle para el expediente"
                value={terminationReason}
                onChange={(event) => setTerminationReason(event.target.value)}
              />
            </label>
            <p className="text-sm leading-6 text-[var(--color-text)]">
              Escribe el nombre completo del empleado para confirmar.
            </p>
            <TextInput
              autoComplete="off"
              label={`Escribe "${expectedName}"`}
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <input
                checked={ackHistory}
                className="mt-0.5 size-4 accent-red-600"
                type="checkbox"
                onChange={(event) => setAckHistory(event.target.checked)}
              />
              <span className="text-sm leading-6 text-[var(--color-text)]">
                Entiendo que perderá acceso y su historial se conserva en el expediente.
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full" variant="secondary" onClick={() => setStep(1)}>
                Atras
              </Button>
              <Button className="w-full" disabled={!nameMatches || !ackHistory} onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[var(--color-text)]">
              Última confirmación. Se dará de baja como “{separationLabel[separationType]}”.
            </p>
            <label className="flex items-start gap-3 rounded-2xl bg-red-50 p-3 ring-1 ring-red-200">
              <input
                checked={ackDelete}
                className="mt-0.5 size-4 accent-red-600"
                type="checkbox"
                onChange={(event) => setAckDelete(event.target.checked)}
              />
              <span className="text-sm leading-6 text-red-900">
                Quiero dar de baja a <span className="font-bold">{target.full_name}</span>.
              </span>
            </label>
            {error ? (
              <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full" variant="secondary" onClick={() => setStep(2)}>
                Atras
              </Button>
              <button
                className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-red-200"
                disabled={!canDelete || saving}
                type="button"
                onClick={handleDelete}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                {saving ? "Dando de baja…" : "Dar de baja"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return <Select label="Rol" value={value} onChange={(event) => onChange(event.target.value as UserRole)}>
        {roleOptions.map((option) => (
          <option key={option} value={option}>
            {roleLabel[option]}
          </option>
        ))}
      </Select>;
}

function DepartmentSelect({
  departments,
  value,
  onChange,
}: {
  departments: Department[];
  value: string;
  onChange: (id: string) => void;
}) {
  return <Select label="Área / Departamento" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Sin área asignada</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </Select>;
}

function ManagerSelect({
  managers,
  value,
  onChange,
}: {
  managers: ManagerOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return <Select label="Jefe directo" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Sin jefe (va directo a RH)</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.full_name} · {roleLabel[manager.role]}
          </option>
        ))}
      </Select>;
}
