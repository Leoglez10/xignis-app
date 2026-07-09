import type { LeaveRequest } from "../../../lib/database.types";

type AgingBadgeProps = {
  request: LeaveRequest;
};

function hoursOld(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export function AgingBadge({ request }: AgingBadgeProps) {
  const h = hoursOld(request.created_at);
  let label: string;
  let tone: string;
  if (h < 24) {
    label = `${Math.max(1, Math.round(h))} h`;
    tone = "bg-slate-100 text-slate-700";
  } else if (h < 48) {
    label = `1 d`;
    tone = "bg-amber-100 text-amber-800";
  } else {
    label = `${Math.floor(h / 24)} d`;
    tone = "bg-rose-100 text-rose-800";
  }
  return (
    <span
      aria-label={`Enviada hace ${label}`}
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}
    >
      {label}
    </span>
  );
}
