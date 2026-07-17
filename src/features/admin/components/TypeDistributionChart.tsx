import { leaveTypeConfig, leaveTypeLabel } from "../../leave-requests/config";
import type { TypeDistribution } from "../services/dashboardService";

type TypeDistributionChartProps = {
  data: TypeDistribution;
};

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <section
        aria-label="Distribucion por tipo"
        className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
      >
        <h2 className="font-bold">Por tipo de permiso</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Sin datos suficientes.</p>
      </section>
    );
  }
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <section
      aria-label="Distribucion por tipo"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <h2 className="font-bold">Por tipo de permiso</h2>
      <ul className="mt-3 space-y-2">
        {sorted.map((d) => {
          const cfg = leaveTypeConfig[d.type];
          const pct = Math.round((d.count / total) * 100);
          return (
            <li key={d.type}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold">{leaveTypeLabel[d.type]}</span>
                <span className="text-[var(--color-muted)]">
                  {d.count} · {pct}%
                </span>
              </div>
              <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${cfg.avatarTone.replace("text-", "bg-").split(" ")[0]}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
