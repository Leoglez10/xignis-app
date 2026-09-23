import { Clock } from "lucide-react";
import type { TimeBankBalance } from "../../leave-requests/services/leaveRequestService";

type TimeBankCardProps = {
  balance: TimeBankBalance;
};

export function TimeBankCard({ balance }: TimeBankCardProps) {
  return (
    <article
      aria-label="Banco de horas"
      className="animate-fade-up rounded-2xl bg-[var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--color-muted)]">Banco de horas</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-text)]">
            {balance.availableHours.toFixed(1)}
            <span className="ml-1 text-base font-bold text-[var(--color-muted)]">h</span>
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
          <Clock aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Para permisos personales
      </p>
    </article>
  );
}
