import { CalendarDays, Check, RotateCcw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { AdminShell } from "../components/adminNav";
import { defaultRules, getRules, saveRules, type AppRules } from "../services/settingsService";

function Toggle({ checked, label, hint, onChange }: { checked: boolean; label: string; hint: string; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-4 ring-1 ring-slate-200">
      <div className="min-w-0 flex-1 pr-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`press inline-flex h-8 w-14 shrink-0 items-center rounded-full p-1 ring-1 transition ${
          checked
            ? "bg-emerald-600 ring-emerald-600"
            : "bg-slate-200 ring-slate-300"
        }`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          aria-hidden="true"
          className={`size-6 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>
    </div>
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
          <section className="animate-fade-up stagger space-y-3 rounded-[24px] bg-[var(--card-muted)] p-4 ring-1 ring-[var(--card-border)] lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
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

            <article className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold">Vacaciones por colaborador</h2>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800">Por persona</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                    Los días disponibles dependen de cada persona, contrato o antigüedad. Configúralos desde Empleados.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="press inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                  type="button"
                  onClick={() => navigate("/admin/employees")}
                >
                  <Users aria-hidden="true" className="size-3.5" />
                  Editar días
                </button>
              </div>
            </article>
          </section>

          {visibleError ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
              {visibleError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className={`text-sm font-semibold ${savedAt ? "text-emerald-700" : "text-[var(--color-muted)]"}`}>
              {savedAt ? "Reglas guardadas." : "Cambios pendientes de guardar."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="press w-full"
                variant="secondary"
                onClick={() => {
                  setRules(defaultRules);
                  setSavedAt(null);
                }}
              >
                <RotateCcw aria-hidden="true" className="size-5" />
                Restaurar
              </Button>
              <Button className="press w-full" disabled={isSaving} onClick={() => void handleSave()}>
                {savedAt ? <Check aria-hidden="true" className="size-5" /> : null}
                {isSaving ? "Guardando…" : savedAt ? "Guardado" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
