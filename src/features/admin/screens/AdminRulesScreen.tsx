import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { AdminShell } from "../components/adminNav";

type Rules = {
  allowHalfDay: boolean;
  maxVacationDays: number;
  notifyByEmail: boolean;
  requireManagerApproval: boolean;
};

const STORAGE_KEY = "xignis.rules";

const defaults: Rules = {
  allowHalfDay: true,
  maxVacationDays: 15,
  notifyByEmail: true,
  requireManagerApproval: true,
};

function loadRules(): Rules {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Rules>) } : defaults;
  } catch {
    return defaults;
  }
}

function Toggle({ checked, label, hint, onChange }: { checked: boolean; label: string; hint: string; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`press relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--color-primary)]" : "bg-slate-300"}`}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}

export function AdminRulesScreen() {
  const [rules, setRules] = useState<Rules>(defaults);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setRules(loadRules());
  }, []);

  function update<K extends keyof Rules>(key: K, value: Rules[K]) {
    setRules((current) => ({ ...current, [key]: value }));
    setSavedAt(null);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    setSavedAt(Date.now());
  }

  return (
    <AdminShell>
      <section className="p-4 md:p-6">
        <header className="animate-fade-up mb-5">
          <p className="text-sm font-black text-[var(--color-muted)]">Recursos Humanos</p>
          <h1 className="mt-1 text-3xl font-black md:text-4xl">Reglas</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Politicas de permisos de la organizacion.</p>
        </header>

        <div className="mx-auto max-w-2xl">
          <section className="animate-fade-up stagger space-y-3 rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
            <Toggle
              checked={rules.requireManagerApproval}
              hint="Las solicitudes pasan primero por el jefe antes de RH."
              label="Aprobacion del jefe"
              onChange={(next) => update("requireManagerApproval", next)}
            />
            <Toggle
              checked={rules.allowHalfDay}
              hint="Permitir permisos por medio dia con horario."
              label="Medio dia"
              onChange={(next) => update("allowHalfDay", next)}
            />
            <Toggle
              checked={rules.notifyByEmail}
              hint="Enviar correo ademas de la notificacion en la app."
              label="Notificar por correo"
              onChange={(next) => update("notifyByEmail", next)}
            />

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="min-w-0">
                <label className="text-sm font-bold" htmlFor="max-vac">
                  Maximo de vacaciones al año
                </label>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Dias por colaborador.</p>
              </div>
              <input
                className="h-12 w-20 rounded-2xl bg-white text-center text-lg font-black outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[var(--color-focus)]"
                id="max-vac"
                inputMode="numeric"
                max={365}
                min={0}
                onChange={(event) => update("maxVacationDays", Number(event.target.value) || 0)}
                type="number"
                value={rules.maxVacationDays}
              />
            </div>
          </section>

          <div className="mt-4 flex items-center gap-3">
            <Button className="press" onClick={handleSave}>
              {savedAt ? <Check aria-hidden="true" className="size-5" /> : null}
              {savedAt ? "Guardado" : "Guardar reglas"}
            </Button>
            <button
              className="press text-sm font-bold text-[var(--color-muted)]"
              onClick={() => {
                setRules(defaults);
                setSavedAt(null);
              }}
              type="button"
            >
              Restaurar valores
            </button>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
