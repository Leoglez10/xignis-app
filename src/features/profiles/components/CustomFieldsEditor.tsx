import { useState } from "react";
import type { Json, ProfileFieldDef } from "../../../lib/database.types";
import { Button } from "../../../components/ui/Button";
import { DateInput } from "../../../components/ui/DateInput";
import { Select } from "../../../components/ui/Select";
import { TextInput } from "../../../components/ui/TextInput";
import { setProfileCustomField } from "../services/profileService";

type CustomFieldsEditorProps = {
  defs: ProfileFieldDef[];
  onSaved: () => void;
  targetId: string;
  values: Record<string, Json>;
};

/** Editor de campos custom para RH. Solo muestra los campos que RH puede escribir
 *  (editable_by ≠ 'self'); el RPC igual revalida permisos en el servidor. */
export function CustomFieldsEditor({ defs, onSaved, targetId, values }: CustomFieldsEditorProps) {
  const editable = defs.filter((d) => d.editable_by !== "self");
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(editable.map((d) => [d.key, toInput(values[d.key], d.field_type)])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  if (editable.length === 0) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      for (const d of editable) {
        const next = toJson(draft[d.key] ?? "", d.field_type);
        const prev = values[d.key] ?? null;
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          await setProfileCustomField(targetId, d.key, next);
        }
      }
      setSavedOk(true);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="animate-fade-up rounded-[28px] bg-white p-6 ring-1 ring-slate-200" aria-label="Editar campos personalizados">
      <h3 className="mb-4 text-base font-black">Campos personalizados</h3>
      <div className="space-y-4">
        {editable.map((d) => {
          const value = draft[d.key] ?? "";
          const set = (next: string) => setDraft((prev) => ({ ...prev, [d.key]: next }));

          if (d.field_type === "boolean") {
            return (
              <Select key={d.key} label={d.label} value={value} onChange={(event) => set(event.target.value)}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </Select>
            );
          }
          if (d.field_type === "select") {
            const options = Array.isArray(d.options) ? d.options.map(String) : [];
            return (
              <Select key={d.key} label={d.label} value={value} onChange={(event) => set(event.target.value)}>
                <option value="">—</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            );
          }
          if (d.field_type === "date") {
            return <DateInput key={d.key} label={d.label} value={value} onChange={(event) => set(event.target.value)} />;
          }
          return (
            <TextInput
              key={d.key}
              label={d.label}
              type={d.field_type === "number" ? "number" : "text"}
              value={value}
              onChange={(event) => set(event.target.value)}
            />
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {savedOk && !error ? <p className="mt-3 text-sm font-semibold text-emerald-700">Guardado.</p> : null}

      <Button className="mt-4 w-full" disabled={saving} type="button" onClick={handleSave}>
        {saving ? "Guardando…" : "Guardar campos"}
      </Button>
    </section>
  );
}

function toInput(value: Json | undefined, type: ProfileFieldDef["field_type"]): string {
  if (value === undefined || value === null) return type === "boolean" ? "false" : "";
  if (type === "boolean") return value ? "true" : "false";
  return String(value);
}

function toJson(str: string, type: ProfileFieldDef["field_type"]): Json {
  if (type === "boolean") return str === "true";
  if (str.trim() === "") return null;
  if (type === "number") {
    const parsed = Number(str);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return str;
}
