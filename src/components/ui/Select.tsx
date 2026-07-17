import { ChevronDown } from "lucide-react";
import { useId, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  hint?: string;
  label: string;
};

export function Select({ children, className = "", error, hint, id, label, required, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;
  return (
    <div className="min-w-0 space-y-2">
      <label className="text-sm font-bold text-[var(--color-text)]" htmlFor={selectId}>
        {label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}
      </label>
      <div className="relative">
        <select
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={`h-13 w-full appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--card-bg)] px-4 pr-11 text-base text-[var(--color-text)] ${className}`}
          id={selectId}
          required={required}
          {...props}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
      </div>
      {error ? <p className="text-sm font-semibold text-red-700" id={descriptionId} role="alert">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-muted)]" id={descriptionId}>{hint}</p> : null}
    </div>
  );
}
