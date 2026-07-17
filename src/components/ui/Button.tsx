import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm hover:bg-emerald-300",
  secondary: "border border-[var(--color-border)] bg-white text-[var(--color-text)]",
  danger: "bg-red-700 text-white shadow-sm hover:bg-red-800",
  ghost: "bg-transparent text-[var(--color-text)]",
};

export function Button({
  children,
  className = "",
  loading = false,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 ${variantClassName[variant]} ${className}`}
      disabled={loading || props.disabled}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
