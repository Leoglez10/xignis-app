import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type ActionRowProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  onClick: () => void;
};

export function ActionRow({ title, description, icon, onClick }: ActionRowProps) {
  return (
    <button
      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface)] px-4 text-left transition hover:bg-slate-100"
      type="button"
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <span>
          <span className="block text-sm font-semibold text-[var(--color-text)]">{title}</span>
          <span className="mt-1 block text-xs text-[var(--color-muted)]">{description}</span>
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
    </button>
  );
}
