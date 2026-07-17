import type { HTMLAttributes } from "react";

type Tone = "danger" | "info" | "neutral" | "success" | "warning";
const tones: Record<Tone, string> = {
  danger: "bg-red-100 text-red-800", info: "bg-blue-100 text-blue-800", neutral: "bg-[var(--color-surface)] text-[var(--color-muted)]", success: "bg-emerald-100 text-emerald-800", warning: "bg-amber-100 text-amber-900",
};
export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tone = props.tone ?? "neutral";
  const { tone: _tone, ...rest } = props;
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`} {...rest} />;
}
export const Chip = Badge;
