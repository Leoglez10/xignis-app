import type { MonthlyTrend } from "../services/dashboardService";

type TrendChartProps = {
  data: MonthlyTrend;
};

const COLORS = {
  approved: "#10b981",
  grid: "#e2e8f0",
  pending: "#f59e0b",
  rejected: "#ef4444",
};

function monthLabel(iso: string): string {
  const d = new Date(`${iso}-01T00:00:00`);
  return d.toLocaleDateString("es", { month: "short" }).replace(".", "");
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null;
  const w = 600;
  const h = 180;
  const padX = 24;
  const padY = 16;
  const max = Math.max(1, ...data.flatMap((d) => [d.approved, d.pending, d.rejected]));
  const stepX = (w - padX * 2) / Math.max(1, data.length - 1);
  const y = (v: number) => h - padY - (v / max) * (h - padY * 2);

  const pathFor = (key: "approved" | "pending" | "rejected") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${padX + i * stepX},${y(d[key])}`)
      .join(" ");

  return (
    <section
      aria-label="Tendencia mensual"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Tendencia 12 meses</h2>
        <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--color-muted)]">
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: COLORS.approved }} />
            Aprobadas
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: COLORS.pending }} />
            Pendientes
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: COLORS.rejected }} />
            Rechazadas
          </span>
        </div>
      </header>
      <svg
        className="block w-full"
        role="img"
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            stroke={COLORS.grid}
            strokeWidth="1"
            x1={padX}
            x2={w - padX}
            y1={padY + t * (h - padY * 2)}
            y2={padY + t * (h - padY * 2)}
          />
        ))}
        <path d={pathFor("approved")} fill="none" stroke={COLORS.approved} strokeWidth="2.5" />
        <path d={pathFor("pending")} fill="none" stroke={COLORS.pending} strokeDasharray="4 3" strokeWidth="2" />
        <path d={pathFor("rejected")} fill="none" stroke={COLORS.rejected} strokeWidth="2" />
        {data.map((d, i) => (
          <text
            fill="#94a3b8"
            fontSize="10"
            fontWeight="700"
            key={d.month}
            textAnchor="middle"
            x={padX + i * stepX}
            y={h - 2}
          >
            {monthLabel(d.month)}
          </text>
        ))}
      </svg>
    </section>
  );
}
