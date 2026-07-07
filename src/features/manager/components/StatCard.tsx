import { memo } from "react";

type StatCardProps = {
  label: string;
  tone: string;
  value: number;
};

export const StatCard = memo(function StatCard({ label, tone, value }: StatCardProps) {
  return (
    <article className={`rounded-[20px] p-4 ring-1 ring-[var(--card-border)] ${tone}`} key={label}>
      <p className="text-sm font-black">{label}</p>
      <p className="mt-1 text-3xl font-black text-[var(--color-text)]">{value}</p>
    </article>
  );
});