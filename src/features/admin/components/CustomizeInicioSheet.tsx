import { BottomSheet } from "../../../components/ui/BottomSheet";
import type { InicioPrefs } from "../hooks/useInicioPrefs";

type CustomizeInicioSheetProps = {
  isOpen: boolean;
  prefs: InicioPrefs;
  onChange: (changes: Partial<InicioPrefs>) => void;
  onClose: () => void;
};

type PrefRow = { hint?: string; key: keyof InicioPrefs; label: string };

const INDICATORS: PrefRow[] = [
  { key: "showActiveEmployees", label: "Empleados activos" },
  { key: "showAbsentToday", label: "Ausentes hoy" },
  { key: "showUtilization", label: "Vacaciones usadas" },
];

const SECTIONS: PrefRow[] = [
  { hint: "Tendencia 12 meses y tipos de permiso", key: "showCharts", label: "Gráficos" },
  { hint: "Altas, bajas y empleados sin actividad", key: "showMovements", label: "Movimientos de plantilla" },
];

function ToggleRow({
  checked,
  disabled = false,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  label: string;
  onChange?: (next: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {hint ? <p className="text-xs text-[var(--color-muted)]">{hint}</p> : null}
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className="press -my-2 -mr-2 inline-flex shrink-0 items-center rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-45"
        disabled={disabled}
        role="switch"
        type="button"
        onClick={() => onChange?.(!checked)}
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

export function CustomizeInicioSheet({ isOpen, onChange, onClose, prefs }: CustomizeInicioSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} title="Personalizar inicio" onClose={onClose}>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Se guarda en este dispositivo. No cambia lo que ven tus compañeros.
      </p>

      <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">Indicadores</h3>
      <ul className="mb-5 divide-y divide-[var(--card-border)]">
        <ToggleRow checked disabled hint="Siempre visible" label="Pendientes" />
        {INDICATORS.map((row) => (
          <ToggleRow
            checked={prefs[row.key]}
            key={row.key}
            label={row.label}
            onChange={(next) => onChange({ [row.key]: next })}
          />
        ))}
      </ul>

      <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">Secciones</h3>
      <ul className="divide-y divide-[var(--card-border)]">
        {SECTIONS.map((row) => (
          <ToggleRow
            checked={prefs[row.key]}
            hint={row.hint}
            key={row.key}
            label={row.label}
            onChange={(next) => onChange({ [row.key]: next })}
          />
        ))}
      </ul>
    </BottomSheet>
  );
}
