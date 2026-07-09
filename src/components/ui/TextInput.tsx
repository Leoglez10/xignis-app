import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextInput({ error, id, label, required, ...props }: TextInputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;

  return (
    <div className="min-w-0 space-y-2">
      <label className="text-sm font-medium text-[var(--color-text)]" htmlFor={inputId}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="h-13 w-full min-w-0 appearance-none rounded-2xl bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none ring-1 ring-inset ring-transparent transition placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-[var(--color-focus)]"
        id={inputId}
        required={required}
        {...props}
      />
      {error ? (
        <p className="text-sm font-semibold text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
