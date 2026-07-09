export function EmployeeDashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 rounded-[24px] bg-[var(--skeleton-base)] animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" />
        <div className="h-20 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" />
      </div>
      <div className="h-16 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" />
      <div className="space-y-3 pt-3">
        {[0, 1, 2].map((i) => (
          <div className="h-[72px] rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={i} />
        ))}
      </div>
    </div>
  );
}
