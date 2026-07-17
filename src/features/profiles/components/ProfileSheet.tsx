import type { Json, ProfileFieldDef, ProfileSheet as ProfileSheetData } from "../../../lib/database.types";
import { formatDateEs } from "../../../lib/date";

type ProfileSheetProps = {
  defs: ProfileFieldDef[];
  email?: string | null;
  sheet: ProfileSheetData;
};

type Row = { label: string; value: string };
type Section = { rows: Row[]; title: string };

/** Ficha de datos (solo lectura). Muestra campos fijos + campos custom agrupados
 *  por sección. El RPC ya filtró qué campos custom puede ver el caller. */
export function ProfileSheet({ defs, email, sheet }: ProfileSheetProps) {
  const sections: Section[] = [];

  const trabajo: Row[] = [
    { label: "Área", value: sheet.department_name ?? "—" },
    { label: "Jefe", value: sheet.manager_name ?? "—" },
    { label: "Puesto", value: sheet.job_title ?? "—" },
    { label: "Ingreso", value: hireLine(sheet.hire_date) },
  ];
  sections.push({ rows: trabajo, title: "Trabajo" });

  const personal: Row[] = [
    { label: "Cumpleaños", value: sheet.birth_date ? formatDateEs(sheet.birth_date) : "—" },
  ];
  if (email !== undefined) personal.push({ label: "Correo", value: email ?? "—" });
  personal.push({
    label: "Vacaciones/año",
    value: sheet.annual_vacation_days != null ? `${sheet.annual_vacation_days} días` : "—",
  });
  sections.push({ rows: personal, title: "Personal" });

  // Campos custom, agrupados por su sección propia, en el orden que trajo listFieldDefs.
  const customBySection = new Map<string, Row[]>();
  for (const def of defs) {
    if (!(def.key in sheet.custom)) continue;
    const row = { label: def.label, value: formatValue(def, sheet.custom[def.key]) };
    const bucket = customBySection.get(def.section);
    if (bucket) bucket.push(row);
    else customBySection.set(def.section, [row]);
  }
  for (const [title, rows] of customBySection) sections.push({ rows, title });

  return (
    <section className="animate-fade-up rounded-[28px] bg-white p-6 ring-1 ring-slate-200" aria-label="Ficha">
      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.title}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
              {s.title}
            </h3>
            <dl className="divide-y divide-slate-100">
              {s.rows.map((r) => (
                <div className="flex items-baseline justify-between gap-4 py-2" key={r.label}>
                  <dt className="shrink-0 text-sm text-[var(--color-muted)]">{r.label}</dt>
                  <dd className="min-w-0 truncate text-right text-sm font-bold text-[var(--color-text)]">
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatValue(def: ProfileFieldDef, raw: Json): string {
  if (raw === null || raw === undefined) return "—";
  switch (def.field_type) {
    case "boolean":
      return raw ? "Sí" : "No";
    case "date":
      return typeof raw === "string" ? formatDateEs(raw) : String(raw);
    default:
      return String(raw);
  }
}

/** Fecha de ingreso + antigüedad calculada. */
function hireLine(hireIso: string | null): string {
  if (!hireIso) return "—";
  const s = seniority(hireIso);
  return s ? `${formatDateEs(hireIso)} · ${s}` : formatDateEs(hireIso);
}

function seniority(hireIso: string): string {
  const start = new Date(`${hireIso}T00:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return "";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? "mes" : "meses"}`);
  return parts.length ? parts.join(" ") : "recién ingresado";
}
