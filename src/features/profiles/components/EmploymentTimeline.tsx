import { Briefcase, Building2, Calendar, UserCog } from "lucide-react";
import type { EmploymentEvent } from "../../../lib/database.types";

type Icon = typeof Briefcase;

const EVENT_META: Record<string, { icon: Icon; label: string; tone: string }> = {
  status_change: { icon: UserCog, label: "Cambio de estado", tone: "bg-indigo-100 text-indigo-700" },
  department_change: { icon: Building2, label: "Cambio de área", tone: "bg-sky-100 text-sky-700" },
  manager_change: { icon: UserCog, label: "Cambio de jefe", tone: "bg-amber-100 text-amber-700" },
  hire: { icon: Briefcase, label: "Alta", tone: "bg-emerald-100 text-emerald-700" },
  termination: { icon: UserCog, label: "Baja", tone: "bg-red-100 text-red-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function describeMeta(eventType: string, metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const meta = metadata as Record<string, unknown>;
  if (eventType === "status_change") {
    const from = meta.from;
    const to = meta.to;
    const sep = meta.separation_type;
    return `${from ? String(from) : "—"} → ${to ? String(to) : "—"}${sep ? ` · ${String(sep)}` : ""}`;
  }
  if (eventType === "department_change") {
    return `${meta.from ? String(meta.from) : "Sin área"} → ${meta.to ? String(meta.to) : "Sin área"}`;
  }
  if (eventType === "manager_change") {
    return `${meta.from ? String(meta.from) : "Sin jefe"} → ${meta.to ? String(meta.to) : "Sin jefe"}`;
  }
  return "";
}

export function EmploymentTimeline({ events }: { events: EmploymentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">Sin eventos laborales registrados todavía.</p>
    );
  }
  return (
    <ol className="space-y-3">
      {events.map((event, index) => {
        const meta = EVENT_META[event.event_type] ?? { icon: Calendar, label: event.event_type, tone: "bg-slate-100 text-slate-700" };
        const Icon = meta.icon;
        return (
          <li className="relative flex gap-3 pl-1" key={event.id}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${meta.tone}`}>
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold">{meta.label}</p>
              <p className="text-xs text-[var(--color-muted)]">{formatDate(event.effective_date)}</p>
              {event.reason ? <p className="mt-1 text-xs leading-5 text-[var(--color-text)]">{event.reason}</p> : null}
              {describeMeta(event.event_type, event.metadata) ? (
                <p className="mt-0.5 text-xs font-semibold text-[var(--color-muted)]">
                  {describeMeta(event.event_type, event.metadata)}
                </p>
              ) : null}
            </div>
            {index !== events.length - 1 ? (
              <span aria-hidden="true" className="absolute left-[18px] top-12 h-[calc(100%-12px)] w-px bg-slate-200" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}