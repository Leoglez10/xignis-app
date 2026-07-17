import { initials } from "../../../lib/avatar";
import { UserMinus } from "lucide-react";
import type { SeparationType } from "../../../lib/database.types";
import type { RecentTermination } from "../services/dashboardService";

type RecentTerminationsWidgetProps = {
  items: RecentTermination[];
};

const separationLabel: Record<SeparationType, string> = {
  voluntary: "Voluntaria",
  involuntary: "Involuntaria",
  end_contract: "Fin contrato",
  relocation: "Traslado",
  retirement: "Jubilación",
  other: "Otra",
};

export function RecentTerminationsWidget({ items }: RecentTerminationsWidgetProps) {
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Bajas recientes"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <UserMinus aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
        <h2 className="font-black">Bajas recientes</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="flex items-center gap-3" key={item.id}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-100 text-[10px] font-black text-red-700">
              {initials(item.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{item.full_name}</p>
              <p className="truncate text-xs text-[var(--color-muted)]">
                {item.job_title ?? "Sin puesto"}
                {item.separation_type ? ` · ${separationLabel[item.separation_type as SeparationType]}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black text-[var(--color-muted)]">
              {new Date(item.terminated_at).toLocaleDateString("es", { day: "2-digit", month: "short" })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}