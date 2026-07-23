/** Skeleton del dashboard: pendientes, agenda y equipo con animate-pulse.
 *  Evita layout shift durante el cold start en WKWebView — se siente nativo. */
export function DashboardSkeleton() {
  return (
    <>
      {/* Pendientes */}
      <div className="rounded-[24px] bg-[var(--card-muted)] p-4">
        <div className="mb-4 h-6 w-44 rounded-full bg-[var(--skeleton-base)] animate-pulse" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div className="h-28 rounded-[20px] bg-[var(--skeleton-base)] animate-pulse" key={`pend-${i}`} />
          ))}
        </div>
      </div>

      {/* Aside */}
      <div className="flex flex-col gap-5">
        <div className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px]">
          <div className="mb-4 h-6 w-36 rounded-full bg-[var(--skeleton-base)] animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div className="h-16 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={`agd-${i}`} />
            ))}
          </div>
        </div>
        <div className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] rounded-2xl md:rounded-[20px]">
          <div className="mb-4 h-6 w-28 rounded-full bg-[var(--skeleton-base)] animate-pulse" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div className="h-16 rounded-2xl bg-[var(--skeleton-base)] animate-pulse" key={`team-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
