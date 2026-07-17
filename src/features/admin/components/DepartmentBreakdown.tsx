import { Building2 } from "lucide-react";
import { useMemo } from "react";
import type { Department, LeaveStatus } from "../../../lib/database.types";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type Bucket = {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
};

export function DepartmentBreakdown({
  requests,
  departments,
}: {
  requests: LeaveRequestWithEmployee[];
  departments: Department[];
}) {
  const buckets = useMemo(() => {
    const byName = new Map<string, Bucket>();
    const nameById = new Map<string, string>();
    for (const d of departments) nameById.set(d.id, d.name);
    const ensure = (name: string): Bucket => {
      const existing = byName.get(name);
      if (existing) return existing;
      const fresh: Bucket = { approved: 0, pending: 0, rejected: 0, total: 0 };
      byName.set(name, fresh);
      return fresh;
    };

    for (const r of requests) {
      const deptId = (r.employee as { department_id?: string | null } | null | undefined)?.department_id;
      const name = (deptId && nameById.get(deptId)) || "Sin área";
      const bucket = ensure(name);
      bucket.total += 1;
      if (r.status === "approved") bucket.approved += 1;
      else if (r.status === "rejected" || r.status === "rejected_by_manager") bucket.rejected += 1;
      else if (r.status === "pending_manager" || r.status === "approved_by_manager" || r.status === "pending_hr")
        bucket.pending += 1;
    }

    return [...byName.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [requests, departments]);

  const max = buckets.length === 0 ? 0 : Math.max(...buckets.map(([, b]) => b.total));

  if (buckets.length === 0 || (buckets.length === 1 && buckets[0][0] === "Sin área" && buckets[0][1].total === 0)) {
    return null;
  }

  return (
    <section
      aria-labelledby="rep-area"
      className="animate-fade-up rounded-[24px] bg-white p-5 ring-1 ring-slate-200"
    >
      <div className="mb-4 flex items-center gap-2">
        <Building2 aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
        <h2 className="text-xl font-bold" id="rep-area">
          Por área
        </h2>
      </div>
      <ul className="space-y-4">
        {buckets.map(([name, b]) => {
          const pct = max === 0 ? 0 : Math.round((b.total / max) * 100);
          return (
            <li key={name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold">{name}</span>
                <span className="font-bold text-[var(--color-muted)]">
                  {b.total}
                  <span className="ml-2 text-[11px] font-semibold">
                    <span className="text-emerald-600">▲{b.approved}</span>{" "}
                    <span className="text-amber-600">●{b.pending}</span>{" "}
                    <span className="text-red-600">▼{b.rejected}</span>
                  </span>
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                {b.approved > 0 && (
                  <div className="h-full bg-emerald-500" style={{ width: `${(b.approved / b.total) * pct}%` }} />
                )}
                {b.pending > 0 && (
                  <div className="h-full bg-amber-500" style={{ width: `${(b.pending / b.total) * pct}%` }} />
                )}
                {b.rejected > 0 && (
                  <div className="h-full bg-red-500" style={{ width: `${(b.rejected / b.total) * pct}%` }} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

