import { initials } from "../../../lib/avatar";
import { Cake } from "lucide-react";
import type { Profile } from "../../../lib/database.types";

type BirthdayStripProps = {
  members: Profile[];
};

function upcomingBirthday(birthISO: string, now: Date = new Date()): { date: Date; days: number } | null {
  const b = new Date(birthISO);
  if (Number.isNaN(b.getTime())) return null;
  const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  const next = thisYear < now ? new Date(now.getFullYear() + 1, b.getMonth(), b.getDate()) : thisYear;
  const days = Math.round((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  return { date: next, days };
}

function upcomingAnniversary(hireISO: string, now: Date = new Date()): { date: Date; years: number; days: number } | null {
  const h = new Date(hireISO);
  if (Number.isNaN(h.getTime())) return null;
  const yearsBase = now.getFullYear() - h.getFullYear();
  const thisYear = new Date(now.getFullYear(), h.getMonth(), h.getDate());
  const isPast = thisYear < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = isPast ? new Date(now.getFullYear() + 1, h.getMonth(), h.getDate()) : thisYear;
  const years = isPast ? yearsBase + 1 : yearsBase;
  const days = Math.round((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  return { date: next, days, years };
}

export function BirthdayStrip({ members }: BirthdayStripProps) {
  const now = new Date();
  const items = members
    .map((m) => {
      const bday = m.birth_date ? upcomingBirthday(m.birth_date, now) : null;
      const anniv = m.hire_date ? upcomingAnniversary(m.hire_date, now) : null;
      return { m, bday, anniv };
    })
    .filter((x) => x.bday || x.anniv)
    .sort((a, b) => {
      const da = a.bday?.days ?? a.anniv?.days ?? 9999;
      const db = b.bday?.days ?? b.anniv?.days ?? 9999;
      return da - db;
    })
    .slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Cumpleanos y aniversarios"
      className="bg-[var(--card-bg)] p-5 ring-1 ring-[var(--card-border)] md:rounded-[20px] md:p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Cake aria-hidden="true" className="size-4 text-[var(--color-muted)]" />
        <h2 className="font-black">Cumpleaños y aniversarios</h2>
      </div>
      <ul className="space-y-2">
        {items.map(({ m, bday, anniv }) => (
          <li
            className="flex items-center gap-3 rounded-2xl bg-[var(--card-muted)] p-3"
            key={`${m.id}-${bday ? "b" : "a"}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
              {initials(m.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{m.full_name}</p>
              <p className="truncate text-xs text-[var(--color-muted)]">
                {bday
                  ? bday.days === 0
                    ? "¡Cumple hoy!"
                    : `Cumple ${bday.date.toLocaleDateString("es", { day: "2-digit", month: "short" })}`
                  : anniv
                    ? anniv.days === 0
                      ? `¡${anniv.years} años hoy!`
                      : `${anniv.years} años el ${anniv.date.toLocaleDateString("es", { day: "2-digit", month: "short" })}`
                    : ""}
              </p>
            </div>
            {bday ? (
              <span className="shrink-0 rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-black text-pink-800">
                {bday.days === 0 ? "Hoy" : `en ${bday.days}d`}
              </span>
            ) : anniv ? (
              <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-800">
                {anniv.days === 0 ? "Hoy" : `en ${anniv.days}d`}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
