import { Check, CircleDot, Clock, X } from "lucide-react";
import type { ApprovalStep, StepState } from "../services/leaveRequestProgressService";

type ApprovalTimelineProps = {
  steps: ApprovalStep[];
};

const STATE_STYLES: Record<
  StepState,
  { badge: string; dot: string; icon: typeof Check; line: string; title: string; subtitle: string }
> = {
  done: {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500 text-white",
    icon: Check,
    line: "bg-emerald-300",
    title: "text-[var(--color-text)]",
    subtitle: "text-[var(--color-muted)]",
  },
  active: {
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500 text-white animate-pulse",
    icon: CircleDot,
    line: "bg-slate-200",
    title: "text-[var(--color-text)]",
    subtitle: "text-[var(--color-muted)]",
  },
  pending: {
    badge: "bg-slate-100 text-slate-500",
    dot: "bg-slate-200 text-slate-500",
    icon: Clock,
    line: "bg-slate-200",
    title: "text-[var(--color-muted)]",
    subtitle: "text-[var(--color-muted)]",
  },
  rejected: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500 text-white",
    icon: X,
    line: "bg-slate-200",
    title: "text-red-700",
    subtitle: "text-red-600/80",
  },
  skipped: {
    badge: "bg-slate-100 text-slate-400",
    dot: "bg-slate-200 text-slate-400",
    icon: X,
    line: "bg-slate-100",
    title: "text-[var(--color-muted)] line-through",
    subtitle: "text-[var(--color-muted)]",
  },
};

const STATE_LABEL: Record<StepState, string> = {
  done: "Listo",
  active: "En curso",
  pending: "Pendiente",
  rejected: "Rechazado",
  skipped: "Omitido",
};

function formatWhen(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalTimeline({ steps }: ApprovalTimelineProps) {
  return (
    <ol className="relative space-y-0" aria-label="Etapas de aprobación">
      {steps.map((step, index) => {
        const style = STATE_STYLES[step.state];
        const Icon = style.icon;
        const isLast = index === steps.length - 1;
        const when = formatWhen(step.occurredAt);

        return (
          <li className="relative flex gap-3 pb-5 last:pb-0" key={`${step.title}-${index}`}>
            {!isLast ? (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${style.line}`}
              />
            ) : null}

            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full ${style.dot} ring-4 ring-[var(--card-bg)]`}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-sm font-black ${style.title}`}>{step.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${style.badge}`}
                >
                  {STATE_LABEL[step.state]}
                </span>
              </div>
              <p className={`mt-0.5 text-xs ${style.subtitle}`}>{step.subtitle}</p>
              {when ? (
                <p className="mt-1 text-[11px] font-semibold text-[var(--color-muted)]">
                  {when}
                </p>
              ) : null}
              {step.comment ? (
                <p className="mt-1 rounded-lg bg-[var(--card-muted)] px-2 py-1 text-xs text-[var(--color-muted)]">
                  “{step.comment}”
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
