import type { HTMLAttributes, ReactNode } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--skeleton-base)] ${className}`} {...props} />;
}
/** Generic page shell used as the lazy-route Suspense fallback (tab swipe peek and
 *  programmatic tab changes) so a loading chunk shows page-shaped placeholders
 *  instead of a blank screen. */
export function PageSkeleton() {
  return (
    <div aria-hidden="true" className="page-wrap py-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[22px]" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-[22px]" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ action, description, title }: { action?: ReactNode; description: string; title: string }) {
  return <div className="rounded-[22px] border border-dashed border-[var(--color-border)] bg-[var(--card-bg)] p-7 text-center"><h2 className="text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}
