import { useState } from "react";
import { Tabs } from "../../../components/ui/Tabs";
import { initials } from "../../../lib/avatar";
import type { SeparationType } from "../../../lib/database.types";
import { roleLabel } from "../../profiles/services/profileService";
import type { InactiveEmployee, RecentOnboarding, RecentTermination } from "../services/dashboardService";

type StaffMovementsCardProps = {
  inactive: InactiveEmployee[];
  onboardings: RecentOnboarding[];
  terminations: RecentTermination[];
};

type Row = { id: string; meta: string; name: string; subtitle: string; tone: string };

const separationLabel: Record<SeparationType, string> = {
  voluntary: "Voluntaria",
  involuntary: "Involuntaria",
  end_contract: "Fin contrato",
  relocation: "Traslado",
  retirement: "Jubilación",
  other: "Otra",
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });

function RowList({ emptyLabel, rows }: { emptyLabel: string; rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm font-semibold text-[var(--color-muted)]">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-[var(--card-border)]">
      {rows.map((row) => (
        <li className="flex items-center gap-3 py-3" key={row.id}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold ${row.tone}`}>
            {initials(row.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{row.name}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">{row.subtitle}</p>
          </div>
          <span className="shrink-0 text-[10px] font-bold text-[var(--color-muted)]">{row.meta}</span>
        </li>
      ))}
    </ul>
  );
}

/** Reemplaza los tres widgets sueltos (altas, bajas, sin actividad) por una
 *  sola tarjeta con pestañas: misma información, un tercio del espacio. */
export function StaffMovementsCard({ inactive, onboardings, terminations }: StaffMovementsCardProps) {
  const [activeId, setActiveId] = useState("onboardings");

  if (onboardings.length === 0 && terminations.length === 0 && inactive.length === 0) return null;

  const onboardingRows: Row[] = onboardings.map((item) => ({
    id: item.id,
    meta: shortDate(item.created_at),
    name: item.full_name,
    subtitle: `${item.job_title ?? "Sin puesto"} · ${roleLabel[item.role as keyof typeof roleLabel] ?? item.role}`,
    tone: "bg-emerald-100 text-emerald-700",
  }));

  const terminationRows: Row[] = terminations.map((item) => ({
    id: item.id,
    meta: shortDate(item.terminated_at),
    name: item.full_name,
    subtitle: `${item.job_title ?? "Sin puesto"}${item.separation_type ? ` · ${separationLabel[item.separation_type as SeparationType]}` : ""}`,
    tone: "bg-red-100 text-red-700",
  }));

  const inactiveRows: Row[] = inactive.map((item) => ({
    id: item.id,
    meta: `${item.daysSince} d`,
    name: item.full_name,
    subtitle: item.job_title ?? "Sin puesto",
    tone: "bg-slate-200 text-slate-700",
  }));

  return (
    <section
      aria-label="Movimientos de plantilla"
      className="flex flex-col gap-4 rounded-[24px] bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:p-6"
    >
      <h2 className="text-lg font-bold md:text-xl">Movimientos de plantilla</h2>
      <Tabs
        activeId={activeId}
        tabs={[
          {
            id: "onboardings",
            label: `Altas ${onboardings.length}`,
            panel: <RowList emptyLabel="Sin altas este mes." rows={onboardingRows} />,
          },
          {
            id: "terminations",
            label: `Bajas ${terminations.length}`,
            panel: <RowList emptyLabel="Sin bajas recientes." rows={terminationRows} />,
          },
          {
            id: "inactive",
            label: `Sin actividad ${inactive.length}`,
            panel: (
              <RowList emptyLabel="Todos con actividad reciente." rows={inactiveRows} />
            ),
          },
        ]}
        onChange={setActiveId}
      />
    </section>
  );
}
