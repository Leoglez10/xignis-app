import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[22px] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm ${className}`} {...props} />;
}
