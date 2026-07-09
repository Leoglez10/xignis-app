import { memo } from "react";

type StatCardProps = {
  label: string;
  tone: string;
  value: number;
};

export const StatCard = memo(function StatCard({ label, tone, value }: StatCardProps) {
  return (
    <article className={`rounded-[20px] p-3 ring-1 ring-[var(--card-border)] ${tone}`} key={label}>
      <p className="text-xs font-black">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--color-text)]">{value}</p>
    </article>
  );
});