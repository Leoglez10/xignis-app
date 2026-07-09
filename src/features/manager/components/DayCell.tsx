import { memo } from "react";
import { leaveTypeConfig } from "../../leave-requests/config";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";

type DayCellProps = {
  absences: LeaveRequestWithEmployee[];
  day: string;
  isInMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: (day: string) => void;
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "X";
}

const MAX_AVATARS = 3;

export const DayCell = memo(function DayCell({ absences, day, isInMonth, isSelected, isToday, onClick }: DayCellProps) {
  const dayNum = Number(day.slice(8, 10));
  const visible = absences.slice(0, MAX_AVATARS);
  const extra = absences.length - visible.length;

  return (
    <button
      className={`press relative flex min-h-16 flex-col gap-1 rounded-2xl p-2 text-left ring-1 ring-[var(--card-border)] transition ${
        isInMonth ? "bg-[var(--card-bg)]" : "bg-[var(--card-muted)] opacity-50"
      } ${isSelected ? "ring-2 ring-[var(--color-primary)] ring-offset-2" : isToday ? "ring-2 ring-[var(--color-primary)]" : ""}`}
      type="button"
      onClick={() => onClick(day)}
      aria-label={`${day}, ${absences.length} ausencias`}
    >
      <span className={`text-xs font-black ${isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>
        {dayNum}
      </span>
      {absences.length > 0 ? (
        <span className="flex flex-wrap gap-0.5">
          {visible.map((a) => (
            <span
              className={`grid size-5 place-items-center rounded-full text-[8px] font-black ${leaveTypeConfig[a.leave_type].avatarTone}`}
              key={a.id}
              title={a.employee?.full_name ?? ""}
            >
              {initials(a.employee?.full_name ?? "X")}
            </span>
          ))}
          {extra > 0 ? <span className="text-[9px] font-black text-[var(--color-muted)]">+{extra}</span> : null}
        </span>
      ) : null}
    </button>
  );
});