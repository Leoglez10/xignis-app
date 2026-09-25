import { Crown, Users } from "lucide-react";
import type { UserRole } from "../lib/database.types";
import { roleLabel } from "../features/profiles/services/profileService";

/** Chip "Dueño" (TopBar y encabezado de Cuenta). */
export function OwnerChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-900">
      <Crown aria-hidden="true" className="size-4" />
      Dueño
    </span>
  );
}

/** Chip "Jefe" del dueño con reportes directos; con `count` muestra "Jefe · N". */
export function ManagerChip({ count }: { count?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
      <Users aria-hidden="true" className="size-4" />
      {count ? `Jefe · ${count}` : "Jefe"}
    </span>
  );
}

/** Chips de rol: el dueño muestra "Dueño" (+ "Jefe" si tiene reportes directos);
 *  el resto, su rol en un chip neutro. */
export function RoleChips({ directReports = 0, role }: { directReports?: number; role: UserRole }) {
  if (role !== "owner") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-muted)]">
        {roleLabel[role]}
      </span>
    );
  }
  return (
    <>
      <OwnerChip />
      {directReports > 0 ? <ManagerChip /> : null}
    </>
  );
}
