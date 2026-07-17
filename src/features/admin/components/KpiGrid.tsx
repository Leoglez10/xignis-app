import type { AdminDashboardStats } from "../services/dashboardService";

type KpiGridProps = {
  stats: AdminDashboardStats;
};

const KPI = [
  { key: "pending", label: "Pendientes", tone: "bg-[var(--stat-pending)] text-[var(--stat-pending-text)]" },
  { key: "approved", label: "Aprobadas", tone: "bg-[var(--stat-upcoming)] text-[var(--stat-upcoming-text)]" },
  { key: "rejected", label: "Rechazadas", tone: "bg-[var(--stat-absent)] text-[var(--stat-absent-text)]" },
];

export function KpiGrid({ stats }: KpiGridProps) {
  const items = [
    ...KPI.map((k) => ({
      key: k.key,
      label: k.label,
      tone: k.tone,
      value:
        k.key === "pending"
          ? stats.pendingCount
          : k.key === "approved"
            ? stats.approvedCount
            : stats.rejectedCount,
    })),
    {
      delta: stats.approvedThisMonth - stats.approvedLastMonth,
      key: "month",
      label: "Aprobadas este mes",
      tone: "bg-slate-100 text-slate-800",
      value: stats.approvedThisMonth,
    },
    {
      key: "active",
      label: "Empleados activos",
      tone: "bg-sky-100 text-sky-800",
      value: stats.activeEmployees,
    },
    {
      key: "util",
      label: "Utilización de vacaciones",
      tone: "bg-indigo-100 text-indigo-800",
      value: `${stats.utilizationPct}%`,
    },
  ];

  return (
    <section
      aria-label="Indicadores RH"
      className="animate-fade-up stagger grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((item) => (
        <article className={`rounded-[20px] p-4 ring-1 ring-[var(--card-border)] ${item.tone}`} key={item.key}>
          <p className="text-[10px] font-bold uppercase tracking-wide">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
          {"delta" in item && item.delta !== undefined ? (
            <p
              aria-label={`${item.delta >= 0 ? "Subió" : "Bajó"} ${Math.abs(item.delta)} vs mes anterior`}
              className={`mt-1 text-[10px] font-bold ${item.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}
            >
              {item.delta >= 0 ? "▲" : "▼"} {Math.abs(item.delta)} vs mes anterior
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
