import { CalendarDays, Check, RotateCcw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { AdminShell } from "../components/adminNav";
import { defaultRules, getRules, saveRules, type AppRules } from "../services/settingsService";

function Toggle({ checked, label, hint, onChange }: { checked: boolean; label: string; hint: string; onChange: (next: boolean) => void }) {
  return (
    <li className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className="press -my-2 -mr-2 inline-flex shrink-0 items-center rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
            checked ? "bg-[var(--color-primary)]" : "bg-slate-300"
          }`}
        >
          <span
            className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
          />
        </span>
      </button>
    </li>
  );
}

export function AdminRulesScreen() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<AppRules>(defaultRules);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rulesQuery = useQuery({ queryKey: ["settings", "rules"], queryFn: getRules });

  useEffect(() => {
    if (rulesQuery.data) setRules(rulesQuery.data);
  }, [rulesQuery.data]);
  const visibleError = error ?? (rulesQuery.error ? "No se pudieron cargar las reglas. Se muestran los valores por defecto." : null);

  function update<K extends keyof AppRules>(key: K, value: AppRules[K]) {
    setRules((current) => ({ ...current, [key]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);
      await saveRules(rules);
      setSavedAt(Date.now());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudieron guardar las reglas.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell>
      <section className="page-wrap py-4 md:py-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-bold text-[var(--color-muted)]">Recursos Humanos</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">Reglas</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Políticas operativas del flujo de permisos.</p>
        </header>

        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <div className="animate-fade-up stagger grid gap-4 lg:grid-cols-2 lg:items-start">
            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-slate-200">
              <h3 className="border-b border-slate-200 px-4 py-3 text-xs font-bold tracking-wide text-[var(--color-muted)] uppercase">
                Flujo de aprobación
              </h3>
              <ul className="divide-y divide-slate-200">
                <Toggle
                  checked={rules.requireManagerApproval}
                  hint="Las solicitudes pasan primero por el jefe directo antes de RH."
                  label="Requiere jefe directo"
                  onChange={(next) => update("requireManagerApproval", next)}
                />
                <Toggle
                  checked={rules.allowHalfDay}
                  hint="Permite permisos por horario o medio día cuando aplique."
                  label="Permisos por medio día"
                  onChange={(next) => update("allowHalfDay", next)}
                />
                <Toggle
                  checked={rules.notifyByEmail}
                  hint="Envía correo además de la notificación dentro de la app."
                  label="Enviar correo"
                  onChange={(next) => update("notifyByEmail", next)}
                />
              </ul>
            </section>

            <article className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">Vacaciones por colaborador</h3>
                  <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                    Por persona
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
                Los días disponibles dependen de cada persona, contrato o antigüedad. Configúralos desde Empleados.
              </p>
              <button
                className="press mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                type="button"
                onClick={() => navigate("/admin/employees")}
              >
                <Users aria-hidden="true" className="size-3.5" />
                Editar días
              </button>
            </article>
          </div>

          {visibleError ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {visibleError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm font-semibold ${savedAt ? "text-emerald-700" : "text-[var(--color-muted)]"}`}>
              {savedAt ? "Reglas guardadas." : "Cambios pendientes de guardar."}
            </p>
            <div className="flex gap-2">
              <Button
                className="press flex-1 sm:flex-none"
                variant="secondary"
                onClick={() => {
                  setRules(defaultRules);
                  setSavedAt(null);
                }}
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Restaurar
              </Button>
              <Button className="press flex-1 sm:flex-none" disabled={isSaving} onClick={() => void handleSave()}>
                {savedAt ? <Check aria-hidden="true" className="size-4" /> : null}
                {isSaving ? "Guardando…" : savedAt ? "Guardado" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
