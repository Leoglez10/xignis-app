type StepDotsProps = {
  current: number;
  total: number;
};

export function StepDots({ current, total }: StepDotsProps) {
  return (
    <div
      aria-label={`Paso ${current + 1} de ${total}`}
      aria-valuemax={total}
      aria-valuemin={1}
      aria-valuenow={current + 1}
      className="flex items-center justify-center gap-2"
      role="progressbar"
    >
      {Array.from({ length: total }, (_, index) => {
        const state =
          index < current ? "done" : index === current ? "active" : "future";

        const sizeClass =
          state === "active" ? "h-2.5 w-6 rounded-full" : "h-2.5 w-2.5 rounded-full";

        const colorClass =
          state === "active"
            ? "bg-[var(--color-primary)]"
            : state === "done"
              ? "bg-[var(--color-primary-strong)]"
              : "bg-slate-300";

        return (
          <span
            aria-current={state === "active" ? "step" : undefined}
            className={`transition-all duration-200 ease-out ${sizeClass} ${colorClass}`}
            key={index}
          />
        );
      })}
    </div>
  );
}
