import { Archive, ArchiveRestore, Building2, ChevronDown, Pencil, Plus, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { TextInput } from "../../../components/ui/TextInput";
import { Avatar } from "../../../components/ui/Avatar";
import { AdminShell } from "../components/adminNav";
import { AREA_PALETTE, areaColor } from "../areaColor";
import {
  assignToDepartment,
  createDepartment,
  listAssignableEmployees,
  listDepartments,
  listDepartmentMembers,
  setDepartmentArchived,
  subscribeToDepartments,
  updateDepartment,
  type AssignableEmployee,
  type DepartmentWithCount,
} from "../services/departmentService";
import { listManagers } from "../../profiles/services/profileService";
import { InviteSheet } from "./EmployeesScreen";
import { successHaptic } from "../../../lib/haptics";
import type { Profile } from "../../../lib/database.types";

type Member = Pick<Profile, "id" | "full_name" | "job_title" | "avatar_url">;

/** Icon-only action with a tooltip that slides in on hover or keyboard focus. */
function IconAction({
  disabled,
  label,
  onClick,
  children,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        aria-label={label}
        className="press grid size-9 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-900 hover:text-white disabled:opacity-50"
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {children}
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 left-1/2 z-20 origin-bottom -translate-x-1/2 scale-90 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-full group-hover:scale-100 group-hover:opacity-100 group-focus-within:-translate-y-full group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

function ColorPicker({ value, onChange }: { value: string | null; onChange: (color: string | null) => void }) {
  return (
    <div>
      <span className="text-sm font-bold">Color del área</span>
      <div aria-label="Color del área" className="mt-2 flex flex-wrap gap-2" role="radiogroup">
        <button
          aria-checked={value === null}
          className={`press grid size-9 place-items-center rounded-full bg-white text-[10px] font-bold text-[var(--color-muted)] ring-1 transition ${
            value === null ? "ring-2 ring-slate-900" : "ring-slate-200"
          }`}
          role="radio"
          title="Automático"
          type="button"
          onClick={() => onChange(null)}
        >
          Auto
        </button>
        {AREA_PALETTE.map((tone) => (
          <button
            aria-checked={value === tone.key}
            aria-label={tone.label}
            className={`press grid size-9 place-items-center rounded-full transition ${
              value === tone.key ? "ring-2 ring-slate-900 ring-offset-2" : "ring-1 ring-slate-200"
            }`}
            key={tone.key}
            role="radio"
            title={tone.label}
            type="button"
            onClick={() => onChange(tone.key)}
          >
            <span aria-hidden="true" className={`size-5 rounded-full ${tone.bar}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentSheet({
  department,
  isOpen,
  onClose,
  onSaved,
}: {
  department: DepartmentWithCount | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
      setColor(department?.color ?? null);
      setError(null);
    }
  }, [isOpen, department]);

  async function handleSave() {
    if (!name.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (department) {
        await updateDepartment(department.id, { name: name.trim(), description: description.trim() || null, color });
      } else {
        await createDepartment(name, description, color);
      }
      void successHaptic();
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el área.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} title={department ? "Editar área" : "Nueva área"} onClose={onClose}>
      <div className="space-y-4 pb-2">
        <TextInput
          label="Nombre"
          placeholder="Diseño, Edición, ..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="block">
          <span className="text-sm font-bold">Descripción (opcional)</span>
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-2xl bg-[var(--color-surface)] p-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <ColorPicker value={color} onChange={setColor} />
        {error ? (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Guardando…" : department ? "Guardar cambios" : "Crear área"}
        </Button>
      </div>
    </BottomSheet>
  );
}

/** Members list that expands under the area card. Fetches only once opened. */
function MembersAccordion({ department, isOpen }: { department: DepartmentWithCount; isOpen: boolean }) {
  const membersQuery = useQuery<Member[]>({
    enabled: isOpen,
    queryKey: ["department-members", department.id],
    queryFn: () => listDepartmentMembers(department.id),
  });
  const members = membersQuery.data ?? [];

  return (
    <div
      className={`grid transition-all duration-300 ease-out ${
        isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        {membersQuery.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div className="h-12 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={i} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-[var(--color-muted)]">
            Sin miembros asignados todavía.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-slate-200" key={m.id}>
                <Avatar name={m.full_name} size="size-9" src={m.avatar_url} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{m.full_name}</p>
                  {m.job_title ? <p className="truncate text-xs text-[var(--color-muted)]">{m.job_title}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Asignador de gente a un área. Dos pasos: elegir y confirmar el resumen.
 *  Una sola confirmación a propósito: mover de área es reversible y queda
 *  registrado en el historial; la ceremonia pesada se reserva para las bajas. */
function AssignMembersSheet({
  department,
  onClose,
  onSaved,
  onCreateNew,
}: {
  department: DepartmentWithCount | null;
  onClose: () => void;
  onSaved: () => void;
  onCreateNew: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = Boolean(department);
  const peopleQuery = useQuery<AssignableEmployee[]>({
    enabled: isOpen,
    queryKey: ["assignable-employees"],
    queryFn: listAssignableEmployees,
  });

  useEffect(() => {
    if (department) {
      setStep(1);
      setQuery("");
      setSelected([]);
      setError(null);
    }
  }, [department]);

  const candidates = useMemo(() => {
    const people = (peopleQuery.data ?? []).filter((p) => p.department_id !== department?.id);
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.full_name.toLowerCase().includes(q) || (p.job_title ?? "").toLowerCase().includes(q),
    );
  }, [peopleQuery.data, department?.id, query]);

  const chosen = useMemo(
    () => (peopleQuery.data ?? []).filter((p) => selected.includes(p.id)),
    [peopleQuery.data, selected],
  );
  const transfers = chosen.filter((p) => p.department);

  if (!department) return null;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleConfirm() {
    if (!department) return;
    try {
      setSaving(true);
      setError(null);
      await assignToDepartment(selected, department.id);
      void successHaptic();
      onSaved();
      onClose();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "No se pudo asignar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} title={`Agregar a ${department.name}`} onClose={onClose}>
      {step === 1 ? (
        <div className="space-y-4">
          <TextInput
            label="Buscar persona"
            placeholder="Nombre o puesto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {peopleQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div className="h-14 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={i} />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-[var(--color-muted)]">
              No hay nadie más para agregar.
            </p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {candidates.map((p) => {
                const isChecked = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl p-2.5 ring-1 transition ${
                        isChecked ? "bg-emerald-50 ring-emerald-300" : "bg-slate-50 ring-slate-200"
                      }`}
                    >
                      <input
                        checked={isChecked}
                        className="size-4 accent-emerald-600"
                        type="checkbox"
                        onChange={() => toggle(p.id)}
                      />
                      <Avatar name={p.full_name} size="size-9" src={p.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{p.full_name}</p>
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {p.department ? `Hoy en ${p.department.name}` : "Sin área"}
                          {p.job_title ? ` · ${p.job_title}` : ""}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <Button className="w-full" variant="secondary" onClick={onCreateNew}>
            <UserPlus aria-hidden="true" className="size-5" />
            Dar de alta a alguien nuevo
          </Button>
          <Button className="w-full" disabled={selected.length === 0} onClick={() => setStep(2)}>
            Continuar ({selected.length})
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--color-text)]">
            Vas a mover {selected.length === 1 ? "a 1 persona" : `a ${selected.length} personas`} a{" "}
            <span className="font-bold">{department.name}</span>.
          </p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {chosen.map((p) => (
              <li className="rounded-2xl bg-slate-50 p-2.5 text-sm ring-1 ring-slate-200" key={p.id}>
                <span className="font-bold">{p.full_name}</span>
                <span className="text-[var(--color-muted)]">
                  {" · "}
                  {p.department ? `${p.department.name} → ${department.name}` : `Sin área → ${department.name}`}
                </span>
              </li>
            ))}
          </ul>
          {transfers.length > 0 ? (
            <p className="rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
              {transfers.length === 1 ? "1 persona sale de su área actual" : `${transfers.length} personas salen de su área actual`}.
              Queda registrado en su historial laboral y se puede revertir.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Button className="w-full" variant="secondary" onClick={() => setStep(1)}>
              Atras
            </Button>
            <Button className="w-full" disabled={saving} onClick={() => void handleConfirm()}>
              {saving ? "Moviendo…" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

export function DepartmentsScreen() {
  const [departments, setDepartments] = useState<DepartmentWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentWithCount | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<DepartmentWithCount | null>(null);
  const [inviteFor, setInviteFor] = useState<DepartmentWithCount | null>(null);

  const queryClient = useQueryClient();
  const managersQuery = useQuery({ queryKey: ["managers"], queryFn: listManagers });

  const load = useCallback(async () => {
    try {
      const data = await listDepartments();
      setDepartments(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las áreas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Tras mover o dar de alta gente: recarga conteos y tira el caché de los
   *  acordeones y del buscador, que ya quedaron viejos. */
  const refreshPeople = useCallback(async () => {
    await load();
    await queryClient.invalidateQueries({ queryKey: ["department-members"] });
    await queryClient.invalidateQueries({ queryKey: ["assignable-employees"] });
  }, [load, queryClient]);

  useEffect(() => {
    void load();
    return subscribeToDepartments(() => void load());
  }, [load]);

  async function toggleArchived(dept: DepartmentWithCount) {
    try {
      setWorkingId(dept.id);
      await setDepartmentArchived(dept.id, !dept.archived_at);
      await load();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "No se pudo actualizar el área.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminShell>
      <section className="page-wrap pb-24 pt-4 md:pt-6">
        <header className="animate-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Áreas</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Departamentos de la organización.</p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-5" />
            Nueva área
          </Button>
        </header>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div className="h-20 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={i} />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] bg-white p-10 text-center ring-1 ring-slate-200">
            <Building2 aria-hidden="true" className="size-10 text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              Sin áreas todavía. Crea la primera para organizar a tu equipo.
            </p>
          </div>
        ) : (
          <ul className="stagger grid items-start gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {departments.map((dept) => {
              const tone = areaColor(dept.id, dept.color);
              const isExpanded = expandedId === dept.id;
              return (
                <li
                  className={`relative overflow-hidden rounded-[20px] bg-white p-4 pl-5 ring-1 ring-slate-200 ${
                    dept.archived_at ? "opacity-60" : ""
                  }`}
                  key={dept.id}
                >
                  <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${tone.bar}`} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-bold">{dept.name}</h2>
                        {dept.archived_at ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                            Archivada
                          </span>
                        ) : null}
                      </div>
                      {dept.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                          {dept.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <IconAction
                        disabled={Boolean(dept.archived_at)}
                        label="Agregar gente"
                        onClick={() => setAssignTarget(dept)}
                      >
                        <Plus aria-hidden="true" className="size-4" />
                      </IconAction>
                      <IconAction
                        label="Editar"
                        onClick={() => {
                          setEditing(dept);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </IconAction>
                      <IconAction
                        disabled={workingId === dept.id}
                        label={dept.archived_at ? "Restaurar" : "Archivar"}
                        onClick={() => void toggleArchived(dept)}
                      >
                        {dept.archived_at ? (
                          <ArchiveRestore aria-hidden="true" className="size-4" />
                        ) : (
                          <Archive aria-hidden="true" className="size-4" />
                        )}
                      </IconAction>
                    </div>
                  </div>

                  <button
                    aria-expanded={isExpanded}
                    className="press mt-3 flex min-h-10 w-full items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                  >
                    <Users aria-hidden="true" className="size-3.5" />
                    {dept.memberCount} {dept.memberCount === 1 ? "miembro" : "miembros"}
                    <ChevronDown
                      aria-hidden="true"
                      className={`ml-auto size-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <MembersAccordion department={dept} isOpen={isExpanded} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <DepartmentSheet
        department={editing}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void load()}
      />

      <AssignMembersSheet
        department={assignTarget}
        onClose={() => setAssignTarget(null)}
        onCreateNew={() => {
          setInviteFor(assignTarget);
          setAssignTarget(null);
        }}
        onSaved={() => void refreshPeople()}
      />

      <InviteSheet
        defaultDepartmentId={inviteFor?.id}
        departments={departments}
        isOpen={Boolean(inviteFor)}
        managers={managersQuery.data ?? []}
        onClose={() => setInviteFor(null)}
        onSaved={() => {
          setInviteFor(null);
          void refreshPeople();
        }}
      />
    </AdminShell>
  );
}
