import { Palmtree } from "lucide-react";
import type { VacationBalance } from "../../leave-requests/services/leaveRequestService";

type VacationBalanceCardProps = {
  balance: VacationBalance;
};

export function VacationBalanceCard({ balance }: VacationBalanceCardProps) {
  const pct = balance.quota > 0 ? Math.min(100, Math.round((balance.taken / balance.quota) * 100)) : 0;
  return (
    <article
      aria-label="Saldo de vacaciones"
      className="animate-fade-up rounded-2xl bg-[var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--color-muted)]">Días disponibles</p>
          <p className="mt-1 text-3xl font-black text-[var(--color-text)]">
            {balance.available}
            <span className="ml-1 text-base font-bold text-[var(--color-muted)]">/ {balance.quota}</span>
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Palmtree aria-hidden="true" className="size-5" />
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        {balance.taken} tomados en {balance.year}
      </p>
    </article>
  );
}
