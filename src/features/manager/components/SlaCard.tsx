import { Timer } from "lucide-react";

type SlaCardProps = {
  avgHours: number | null;
  count: number;
};

function fmt(hours: number): { label: string; tone: string } {
  if (hours < 1) return { label: `${Math.max(1, Math.round(hours * 60))} min`, tone: "text-emerald-700" };
  if (hours < 24) return { label: `${Math.round(hours)} h`, tone: "text-emerald-700" };
  if (hours < 48) return { label: `${Math.round(hours)} h`, tone: "text-amber-700" };
  return { label: `${(hours / 24).toFixed(1)} d`, tone: "text-rose-700" };
}

export function SlaCard({ avgHours, count }: SlaCardProps) {
  const value = avgHours === null ? { label: "—", tone: "text-[var(--color-muted)]" } : fmt(avgHours);
  return (
    <article
      aria-label="Tiempo promedio de aprobacion"
      className="rounded-[20px] bg-[var(--card-bg)] p-3 ring-1 ring-[var(--card-border)]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-[var(--color-muted)]">SLA 30d</p>
        <Timer aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
      </div>
      <p className={`mt-1 text-2xl font-black ${value.tone}`}>
        {value.label}
      </p>
      <p className="mt-0.5 text-[10px] font-bold text-[var(--color-muted)]">
        {count === 0 ? "Sin cierres aún" : `${count} cierre${count === 1 ? "" : "s"}`}
      </p>
    </article>
  );
}
