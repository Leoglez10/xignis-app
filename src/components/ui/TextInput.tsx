import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextInput({ className = "", error, hint, id, label, required, ...props }: TextInputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="min-w-0 space-y-2">
      <label className="text-sm font-medium text-[var(--color-text)]" htmlFor={inputId}>
        {label}{required ? <span aria-hidden="true" className="text-red-700"> *</span> : null}
      </label>
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={`text-input h-13 w-full min-w-0 appearance-none rounded-2xl border-x-0 border-t-0 border-b-2 border-transparent bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] transition placeholder:text-[var(--color-muted)] ${className}`}
        id={inputId}
        required={required}
        {...props}
      />
      {error ? (
        <p className="text-sm font-semibold text-red-700" id={descriptionId} role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-xs text-[var(--color-muted)]" id={descriptionId}>{hint}</p> : null}
    </div>
  );
}
