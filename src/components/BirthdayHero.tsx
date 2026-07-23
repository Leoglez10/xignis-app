import { PartyPopper } from "lucide-react";
import { useAuth } from "../features/session/AuthContext";

/**
 * Full-width celebration banner shown ONLY on the signed-in user's own
 * birthday. Role-independent — mounted on every dashboard. Parses the
 * YYYY-MM-DD string directly to avoid timezone off-by-one on date-only values.
 */
export function BirthdayHero() {
  const { profile } = useAuth();
  if (!profile?.birth_date) return null;

  const [, mm, dd] = profile.birth_date.split("-");
  const now = new Date();
  if (Number(mm) !== now.getMonth() + 1 || Number(dd) !== now.getDate()) return null;

  const firstName = profile.full_name.split(" ")[0];
  return (
    <div
      aria-label={`Feliz cumpleaños, ${firstName}`}
      className="animate-fade-up relative mb-5 flex items-center gap-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-pink-500 via-fuchsia-500 to-emerald-500 p-5 text-white shadow-xl md:p-6"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
        <PartyPopper aria-hidden="true" className="size-7" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-extrabold tracking-tight">¡Feliz cumpleaños, {firstName}! 🎉</p>
        <p className="mt-0.5 text-sm text-white/90">
          Que tengas un gran día. Todo el equipo te lo desea.
        </p>
      </div>
    </div>
  );
}
