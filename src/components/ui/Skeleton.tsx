import type { HTMLAttributes, ReactNode } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--skeleton-base)] ${className}`} {...props} />;
}
export function EmptyState({ action, description, title }: { action?: ReactNode; description: string; title: string }) {
  return <div className="rounded-[22px] border border-dashed border-[var(--color-border)] bg-[var(--card-bg)] p-7 text-center"><h2 className="text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}
