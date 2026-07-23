import { ArchiveRestore, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { TextInput } from "../../../components/ui/TextInput";
import type { CustomFieldType, FieldEditable, FieldVisibility, ProfileFieldDef } from "../../../lib/database.types";
import { usePageTitle } from "../../../lib/usePageTitle";
import { AdminShell } from "../components/adminNav";
import {
  createFieldDef,
  listAllFieldDefs,
  setFieldDefArchived,
  updateFieldDef,
  type FieldDefInput,
} from "../../profiles/services/profileService";

const TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
  select: "Lista",
  boolean: "Sí / No",
};
const VIS_LABEL: Record<FieldVisibility, string> = {
  all: "Todos",
  manager: "Jefe + RH",
  private: "Dueño + RH",
  rh_confidential: "Solo RH",
};
const EDIT_LABEL: Record<FieldEditable, string> = {
  self_and_rh: "Dueño + RH",
  rh_only: "Solo RH",
  self: "Solo dueño",
};

export function FieldDefsScreen() {
  const navigate = useNavigate();
  const [defs, setDefs] = useState<ProfileFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProfileFieldDef | null>(null);
  const [creating, setCreating] = useState(false);

  usePageTitle("Campos personalizados");

  async function load() {
    try {
      setDefs(await listAllFieldDefs());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los campos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleArchive(def: ProfileFieldDef) {
    try {
      await setFieldDefArchived(def.id, def.archived_at === null);
      await load();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "No se pudo actualizar.");
    }
  }

  return (
    <AdminShell>
      <div className="page-wrap pb-10 pt-5">
        <header className="animate-fade-up mb-6 flex items-center gap-3">
          <button
            aria-label="Regresar"
            className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-slate-200"
            type="button"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <h2 className="flex-1 truncate text-2xl font-bold md:text-3xl">Campos personalizados</h2>
          <button
            aria-label="Nuevo campo"
            className="press grid size-11 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
            type="button"
            onClick={() => setCreating(true)}
          >
            <Plus aria-hidden="true" className="size-5" />
          </button>
        </header>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando…</p>
        ) : (
          <ul className="stagger grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
            {defs.length === 0 ? (
              <li className="col-span-full rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[var(--color-muted)] ring-1 ring-slate-200">
                Todavía no hay campos. Creá el primero con el botón +.
              </li>
            ) : null}
            {defs.map((def) => (
              <li
                className={`flex items-center gap-3 rounded-[20px] bg-white p-4 ring-1 ring-slate-200 ${def.archived_at ? "opacity-60" : ""}`}
                key={def.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {def.label} <span className="text-xs font-semibold text-[var(--color-muted)]">({def.key})</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{TYPE_LABEL[def.field_type]}</span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-800">Ve: {VIS_LABEL[def.visibility]}</span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">Edita: {EDIT_LABEL[def.editable_by]}</span>
                    <span className="text-[var(--color-muted)]">{def.section}</span>
                    {def.archived_at ? <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">Archivado</span> : null}
                  </div>
                </div>
                <button
                  aria-label={`Editar ${def.label}`}
                  className="press grid size-10 place-items-center rounded-full bg-slate-100 text-[var(--color-text)]"
                  type="button"
                  onClick={() => setEditing(def)}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>
                <button
                  aria-label={def.archived_at ? `Restaurar ${def.label}` : `Archivar ${def.label}`}
                  className="press grid size-10 place-items-center rounded-full bg-slate-100 text-[var(--color-text)]"
                  type="button"
                  onClick={() => toggleArchive(def)}
                >
                  {def.archived_at ? <ArchiveRestore aria-hidden="true" className="size-4" /> : <Trash2 aria-hidden="true" className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FieldDefSheet
        existingKeys={defs.map((d) => d.key)}
        target={creating ? "new" : editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await load();
        }}
      />
    </AdminShell>
  );
}

function FieldDefSheet({
  existingKeys,
  target,
  onClose,
  onSaved,
}: {
  existingKeys: string[];
  target: ProfileFieldDef | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = target === "new";
  const def = target && target !== "new" ? target : null;

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [section, setSection] = useState("General");
  const [visibility, setVisibility] = useState<FieldVisibility>("all");
  const [editableBy, setEditableBy] = useState<FieldEditable>("rh_only");
  const [options, setOptions] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    if (def) {
      setKey(def.key);
      setLabel(def.label);
      setFieldType(def.field_type);
      setSection(def.section);
      setVisibility(def.visibility);
      setEditableBy(def.editable_by);
      setOptions(Array.isArray(def.options) ? def.options.map(String).join(", ") : "");
      setSortOrder(String(def.sort_order));
    } else {
      setKey("");
      setLabel("");
      setFieldType("text");
      setSection("General");
      setVisibility("all");
      setEditableBy("rh_only");
      setOptions("");
      setSortOrder("0");
    }
    setError(null);
  }, [target, def]);

  async function handleSubmit() {
    const trimmedKey = key.trim().toLowerCase();
    if (isNew && !/^[a-z][a-z0-9_]*$/.test(trimmedKey)) {
      setError("La clave debe empezar con letra y usar solo minúsculas, números y guion bajo.");
      return;
    }
    if (isNew && existingKeys.includes(trimmedKey)) {
      setError("Ya existe un campo con esa clave.");
      return;
    }
    if (!label.trim()) {
      setError("El rótulo es obligatorio.");
      return;
    }

    const optionList =
      fieldType === "select"
        ? options.split(",").map((o) => o.trim()).filter(Boolean)
        : null;
    const base: Omit<FieldDefInput, "key"> = {
      label: label.trim(),
      field_type: fieldType,
      section: section.trim() || "General",
      visibility,
      editable_by: editableBy,
      options: optionList,
      sort_order: Number(sortOrder) || 0,
    };

    try {
      setSaving(true);
      if (isNew) await createFieldDef({ ...base, key: trimmedKey });
      else if (def) await updateFieldDef(def.id, base);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={Boolean(target)} title={isNew ? "Nuevo campo" : "Editar campo"} onClose={onClose}>
      <div className="min-w-0 space-y-4">
        {isNew ? (
          <TextInput label="Clave (identificador)" placeholder="ej: telefono" value={key} onChange={(e) => setKey(e.target.value)} />
        ) : (
          <p className="text-xs font-semibold text-[var(--color-muted)]">Clave: {key}</p>
        )}
        <TextInput label="Rótulo" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Select label="Tipo" value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomFieldType)}>
          {(Object.keys(TYPE_LABEL) as CustomFieldType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        {fieldType === "select" ? (
          <TextInput label="Opciones (separadas por coma)" value={options} onChange={(e) => setOptions(e.target.value)} />
        ) : null}
        <TextInput label="Sección" value={section} onChange={(e) => setSection(e.target.value)} />
        <Select label="Quién lo ve" value={visibility} onChange={(e) => setVisibility(e.target.value as FieldVisibility)}>
          {(Object.keys(VIS_LABEL) as FieldVisibility[]).map((v) => (
            <option key={v} value={v}>
              {VIS_LABEL[v]}
            </option>
          ))}
        </Select>
        <Select label="Quién lo edita" value={editableBy} onChange={(e) => setEditableBy(e.target.value as FieldEditable)}>
          {(Object.keys(EDIT_LABEL) as FieldEditable[]).map((v) => (
            <option key={v} value={v}>
              {EDIT_LABEL[v]}
            </option>
          ))}
        </Select>
        <TextInput label="Orden" inputMode="numeric" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />

        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" disabled={saving} onClick={handleSubmit}>
          {saving ? "Guardando…" : "Guardar campo"}
        </Button>
      </div>
    </BottomSheet>
  );
}
