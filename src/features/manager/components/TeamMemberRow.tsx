import { initials } from "../../../lib/avatar";
import { memo } from "react";
import type { Profile } from "../../../lib/database.types";

type TeamMemberRowProps = {
  absentToday: boolean;
  mount?: boolean;
  member: Profile;
  onClick?: () => void;
};

export const TeamMemberRow = memo(function TeamMemberRow({
  absentToday,
  mount = false,
  member,
  onClick,
}: TeamMemberRowProps) {
  return (
    <li
      className="flex items-center gap-3 rounded-2xl bg-[var(--card-bg)] p-3 ring-1 ring-[var(--card-border)]"
      data-mount={mount ? "true" : undefined}
    >
      <button
        className="press flex w-full items-center gap-3 text-left"
        type="button"
        disabled={!onClick}
        onClick={onClick}
        aria-label={`Ver detalle de ${member.full_name}`}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
          {initials(member.full_name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black">{member.full_name}</span>
          <span className="block truncate text-xs text-[var(--color-muted)]">
            {member.job_title ?? "Sin puesto"}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            absentToday ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {absentToday ? "Ausente hoy" : "Disponible"}
        </span>
      </button>
    </li>
  );
});