import { Archive, ArchiveRestore, Building2, Pencil, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { TextInput } from "../../../components/ui/TextInput";
import { Avatar } from "../../../components/ui/Avatar";
import { AdminShell } from "../components/adminNav";
import {
  createDepartment,
  listDepartments,
  listDepartmentMembers,
  setDepartmentArchived,
  subscribeToDepartments,
  updateDepartment,
  type DepartmentWithCount,
} from "../services/departmentService";
import { successHaptic } from "../../../lib/haptics";
import type { Profile } from "../../../lib/database.types";

type Member = Pick<Profile, "id" | "full_name" | "job_title" | "avatar_url">;

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
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
        await updateDepartment(department.id, { name: name.trim(), description: description.trim() || null });
      } else {
        await createDepartment(name, description);
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
          <span className="text-sm font-black">Descripción (opcional)</span>
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-2xl bg-[var(--color-surface)] p-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
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

function MembersSheet({
  department,
  onClose,
}: {
  department: DepartmentWithCount | null;
  onClose: () => void;
}) {
  const membersQuery = useQuery<Member[]>({ enabled: Boolean(department), queryKey: ["department-members", department?.id], queryFn: () => listDepartmentMembers(department!.id) });
  const members = membersQuery.data ?? [];
  const isLoading = membersQuery.isLoading;

  return (
    <BottomSheet isOpen={department !== null} title={department ? `Miembros de ${department.name}` : "Miembros"} onClose={onClose}>
      {isLoading ? (
        <div className="space-y-3 pb-2">
          {[0, 1].map((i) => (
            <div className="h-14 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={i} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="pb-4 text-sm font-semibold text-[var(--color-muted)]">Sin miembros asignados todavía.</p>
      ) : (
        <ul className="space-y-2 pb-2">
          {members.map((m) => (
            <li className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200" key={m.id}>
              <Avatar className="size-10" name={m.full_name} src={m.avatar_url} />
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{m.full_name}</p>
                {m.job_title ? <p className="truncate text-xs text-[var(--color-muted)]">{m.job_title}</p> : null}
              </div>
            </li>
          ))}
        </ul>
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
  const [viewingMembers, setViewingMembers] = useState<DepartmentWithCount | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

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
      <section className="p-4 md:p-6">
        <header className="animate-fade-up mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">Áreas</h2>
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
          <ul className="stagger grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <li
                className={`rounded-[20px] bg-white p-4 ring-1 ring-slate-200 ${dept.archived_at ? "opacity-60" : ""}`}
                key={dept.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-black">{dept.name}</h2>
                      {dept.archived_at ? (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-700">
                          Archivada
                        </span>
                      ) : null}
                    </div>
                    {dept.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">{dept.description}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className="press inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                    type="button"
                    onClick={() => setViewingMembers(dept)}
                  >
                    <Users aria-hidden="true" className="size-3.5" />
                    {dept.memberCount} {dept.memberCount === 1 ? "miembro" : "miembros"}
                  </button>
                  <button
                    className="press inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                    type="button"
                    onClick={() => {
                      setEditing(dept);
                      setEditorOpen(true);
                    }}
                  >
                    <Pencil aria-hidden="true" className="size-3.5" />
                    Editar
                  </button>
                  <button
                    className="press inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 disabled:opacity-50"
                    disabled={workingId === dept.id}
                    type="button"
                    onClick={() => void toggleArchived(dept)}
                  >
                    {dept.archived_at ? (
                      <ArchiveRestore aria-hidden="true" className="size-3.5" />
                    ) : (
                      <Archive aria-hidden="true" className="size-3.5" />
                    )}
                    {dept.archived_at ? "Restaurar" : "Archivar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DepartmentSheet
        department={editing}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void load()}
      />
      <MembersSheet department={viewingMembers} onClose={() => setViewingMembers(null)} />
    </AdminShell>
  );
}
