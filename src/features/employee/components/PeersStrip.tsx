import { initials } from "../../../lib/avatar";
import { CalendarOff } from "lucide-react";
import type { Profile } from "../../../lib/database.types";
import type { LeaveRequest } from "../../../lib/database.types";

type PeersStripProps = {
  peers: Profile[];
  absences: LeaveRequest[];
};

export function PeersStrip({ peers, absences }: PeersStripProps) {
  if (peers.length === 0) return null;
  const absentIds = new Set(absences.map((a) => a.employee_id));
  const absentPeers = peers.filter((p) => absentIds.has(p.id));
  return (
    <section
      aria-label="Compañeros ausentes hoy"
      className="animate-fade-up mt-5"
    >
      <h2 className="mb-3 text-lg font-black text-[var(--color-text)]">Compañeros hoy</h2>
      {absentPeers.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-muted)]">
          Todos tus compañeros están disponibles.
        </p>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-2">
          {absentPeers.map((peer) => (
            <li
              key={peer.id}
              className="flex shrink-0 items-center gap-2 rounded-full bg-rose-50 px-3 py-2 ring-1 ring-rose-100"
            >
              <span className="grid size-7 place-items-center rounded-full bg-rose-100 text-[10px] font-black text-rose-700">
                {initials(peer.full_name)}
              </span>
              <span className="text-sm font-bold text-rose-900">{peer.full_name.split(" ")[0]}</span>
              <CalendarOff aria-hidden="true" className="size-4 text-rose-700" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
