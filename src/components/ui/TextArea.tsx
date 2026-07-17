import { useId, type TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; hint?: string; label: string };

export function TextArea({ className = "", error, hint, id, label, maxLength, required, value, ...props }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const length = typeof value === "string" ? value.length : undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-bold text-[var(--color-text)]" htmlFor={inputId}>
          {label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}
        </label>
        {maxLength && length !== undefined ? <span className="text-xs text-[var(--color-muted)]">{length}/{maxLength}</span> : null}
      </div>
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={`min-h-28 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--card-bg)] px-4 py-3 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] ${className}`}
        id={inputId}
        maxLength={maxLength}
        required={required}
        value={value}
        {...props}
      />
      {error ? <p className="text-sm font-semibold text-red-700" id={descriptionId} role="alert">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-muted)]" id={descriptionId}>{hint}</p> : null}
    </div>
  );
}
