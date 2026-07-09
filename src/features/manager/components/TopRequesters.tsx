import { TrendingUp } from "lucide-react";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import type { Profile } from "../../../lib/database.types";

type TopRequestersProps = {
  members: Profile[];
  requests: LeaveRequestWithEmployee[];
  months?: number;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

export function TopRequesters({ members, requests, months = 6 }: TopRequestersProps) {
  if (members.length === 0) return null;
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceIso = since.toISOString();
  const counts = new Map<string, number>();
  for (const r of requests) {
    if (r.created_at < sinceIso) continue;
    counts.set(r.employee_id, (counts.get(r.employee_id) ?? 0) + 1);
  }
  const ranked = members
    .map((m) => ({ m, count: counts.get(m.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const max = Math.max(1, ...ranked.map((r) => r.count));
  const hasData = ranked.some((r) => r.count > 0);
  if (!hasData) return null;

  return (
    <section
      aria-label="Top solicitantes"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
        <h2 className="font-black">Top solicitantes ({months}m)</h2>
      </div>
      <ul className="space-y-2">
        {ranked.map(({ m, count }) => (
          <li className="flex items-center gap-3" key={m.id}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
              {initials(m.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{m.full_name}</span>
                <span className="shrink-0 text-xs font-black text-[var(--color-muted)]">{count}</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-indigo-50">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
