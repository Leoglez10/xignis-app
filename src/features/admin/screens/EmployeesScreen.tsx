import { ArrowLeft, Pencil, Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import type { Profile, UserRole } from "../../../lib/database.types";
import { AdminShell } from "../components/adminNav";
import {
  inviteUser,
  listEmployees,
  listManagers,
  roleLabel,
  updateProfileAssignment,
  type ProfileWithManager,
} from "../../profiles/services/profileService";

const roleBadge: Record<UserRole, string> = {
  admin: "bg-slate-900 text-white",
  hr_admin: "bg-indigo-100 text-indigo-800",
  manager: "bg-blue-100 text-blue-800",
  employee: "bg-emerald-100 text-emerald-800",
};

const roleOptions: UserRole[] = ["employee", "manager", "hr_admin", "admin"];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

export function EmployeesScreen() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<ProfileWithManager[]>([]);
  const [managers, setManagers] = useState<Pick<Profile, "id" | "full_name" | "role">[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProfileWithManager | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) => e.full_name.toLowerCase().includes(q) || (e.job_title ?? "").toLowerCase().includes(q),
    );
  }, [employees, query]);

  async function load() {
    try {
      const [emps, mgrs] = await Promise.all([listEmployees(), listManagers()]);
      setEmployees(emps);
      setManagers(mgrs);
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
      <div className="mx-auto w-full max-w-5xl px-4 py-5 md:px-8 md:py-8">
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
            <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
            <h1 className="text-2xl font-black md:text-3xl">Empleados</h1>
          </div>
          <Button className="min-h-12 px-4" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden="true" className="mr-2 size-4" />
            Agregar
          </Button>
        </header>

        <label className="animate-fade-up relative mb-5 block">
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

        {isLoading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando directorio…</p>
        ) : (
          <ul className="stagger grid gap-3 sm:grid-cols-2">
            {filtered.length === 0 ? (
              <li className="rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200 sm:col-span-2">
                Sin empleados que coincidan.
              </li>
            ) : null}
            {filtered.map((emp) => (
              <li
                className="flex items-center gap-4 rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-slate-200"
                key={emp.id}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                  {initials(emp.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{emp.full_name}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{emp.job_title ?? "Sin puesto"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${roleBadge[emp.role]}`}>
                      {roleLabel[emp.role]}
                    </span>
                    {emp.manager?.full_name ? (
                      <span className="text-[11px] text-[var(--color-muted)]">Jefe: {emp.manager.full_name}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  aria-label={`Editar a ${emp.full_name}`}
                  className="press grid size-10 place-items-center rounded-full bg-slate-100 text-[var(--color-text)]"
                  type="button"
                  onClick={() => setEditTarget(emp)}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InviteSheet
        isOpen={inviteOpen}
        managers={managers}
        onClose={() => setInviteOpen(false)}
        onSaved={async () => {
          setInviteOpen(false);
          await load();
        }}
      />

      <EditSheet
        managers={managers}
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          setEditTarget(null);
          await load();
        }}
      />
    </AdminShell>
  );
}

type ManagerOption = Pick<Profile, "id" | "full_name" | "role">;

function InviteSheet({
  isOpen,
  managers,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  managers: ManagerOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!fullName.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Revisa nombre y correo.");
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
      });
      setEmail("");
      setFullName("");
      setJobTitle("");
      setRole("employee");
      setManagerId("");
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo invitar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} title="Agregar empleado" onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextInput label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput label="Puesto" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        <RoleSelect value={role} onChange={setRole} />
        <ManagerSelect managers={managers} value={managerId} onChange={setManagerId} />

        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs leading-5 text-[var(--color-muted)]">
          Se enviará un correo de invitación. Al abrirlo, la persona define su password y entra a la app.
        </p>

        <Button className="w-full" disabled={saving} onClick={handleSubmit}>
          {saving ? "Enviando invitación…" : "Enviar invitación"}
        </Button>
      </div>
    </BottomSheet>
  );
}

function EditSheet({
  managers,
  target,
  onClose,
  onSaved,
}: {
  managers: ManagerOption[];
  target: ProfileWithManager | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<UserRole>("employee");
  const [managerId, setManagerId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setRole(target.role);
      setManagerId(target.manager_id ?? "");
      setJobTitle(target.job_title ?? "");
      setError(null);
    }
  }, [target]);

  async function handleSubmit() {
    if (!target) return;
    try {
      setSaving(true);
      await updateProfileAssignment(target.id, {
        role,
        manager_id: managerId || null,
        job_title: jobTitle.trim() || null,
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
      <div className="space-y-4">
        <TextInput label="Puesto" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        <RoleSelect value={role} onChange={setRole} />
        <ManagerSelect
          managers={managers.filter((m) => m.id !== target?.id)}
          value={managerId}
          onChange={setManagerId}
        />
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

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--color-text)]">Rol</span>
      <select
        className="h-13 w-full rounded-2xl bg-[var(--color-surface)] px-4 text-base font-semibold text-[var(--color-text)] outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[var(--color-focus)]"
        value={value}
        onChange={(event) => onChange(event.target.value as UserRole)}
      >
        {roleOptions.map((option) => (
          <option key={option} value={option}>
            {roleLabel[option]}
          </option>
        ))}
      </select>
    </label>
  );
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
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--color-text)]">Jefe directo</span>
      <select
        className="h-13 w-full rounded-2xl bg-[var(--color-surface)] px-4 text-base font-semibold text-[var(--color-text)] outline-none ring-1 ring-transparent focus:ring-2 focus:ring-[var(--color-focus)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Sin jefe (va directo a RH)</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.full_name} · {roleLabel[manager.role]}
          </option>
        ))}
      </select>
    </label>
  );
}
