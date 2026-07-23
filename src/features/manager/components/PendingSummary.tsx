import { leaveTypeConfig } from "../../leave-requests/config";
import type { LeaveType } from "../../../lib/database.types";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type PendingSummaryProps = {
  pending: LeaveRequestWithEmployee[];
};

// Solid bar color per leave type (config tones are light chip backgrounds).
const barTone: Record<LeaveType, string> = {
  vacation: "bg-emerald-500",
  personal: "bg-indigo-500",
  sick: "bg-rose-500",
  other: "bg-slate-400",
};

const ORDER: LeaveType[] = ["vacation", "personal", "sick", "other"];

export function PendingSummary({ pending }: PendingSummaryProps) {
  if (pending.length === 0) return null;

  const counts = ORDER.map((type) => ({
    type,
    count: pending.filter((p) => p.leave_type === type).length,
  })).filter((s) => s.count > 0);

  const total = pending.length;
  const top = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);
  const topLabel = leaveTypeConfig[top.type].label.toLowerCase();

  // Mega-summary: one plain sentence a manager gets at a glance.
  const summary =
    counts.length === 1
      ? `Todas son ${topLabel}.`
      : `La mayoría son ${topLabel} (${top.count} de ${total}).`;

  return (
    <section
      aria-label="Resumen de solicitudes pendientes"
      className="animate-fade-up mb-5 rounded-[20px] bg-[var(--card-muted)] p-4 ring-1 ring-[var(--card-border)]"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold">
          {total} pendiente{total === 1 ? "" : "s"}
        </p>
        <p className="text-xs font-semibold text-[var(--color-muted)]">{summary}</p>
      </div>

      {/* Stacked bar — width of each segment = share of that type. */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--card-bg)]">
        {counts.map((s) => (
          <span
            className={barTone[s.type]}
            key={s.type}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${leaveTypeConfig[s.type].label}: ${s.count}`}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {counts.map((s) => (
          <li className="flex items-center gap-1.5 text-xs font-semibold" key={s.type}>
            <span className={`size-2.5 rounded-full ${barTone[s.type]}`} />
            <span>{leaveTypeConfig[s.type].label}</span>
            <span className="text-[var(--color-muted)]">{s.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
