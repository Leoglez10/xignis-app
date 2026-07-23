import { initials } from "../../../lib/avatar";
import { UserPlus } from "lucide-react";
import { roleLabel } from "../../profiles/services/profileService";
import type { RecentOnboarding } from "../services/dashboardService";

type RecentOnboardingsWidgetProps = {
  items: RecentOnboarding[];
};

export function RecentOnboardingsWidget({ items }: RecentOnboardingsWidgetProps) {
  if (items.length === 0) return null;
  return (
    <section
      aria-label="Onboarding reciente"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <UserPlus aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
        <h2 className="font-bold">Nuevos este mes</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="flex items-center gap-3" key={item.id}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(item.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.full_name}</p>
              <p className="truncate text-xs text-[var(--color-muted)]">
                {item.job_title ?? "Sin puesto"} · {roleLabel[item.role as keyof typeof roleLabel] ?? item.role}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-[var(--color-muted)]">
              {new Date(item.created_at).toLocaleDateString("es", { day: "2-digit", month: "short" })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
