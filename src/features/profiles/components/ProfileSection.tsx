import { Check, History, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hireLine, ProfileSheet } from "./ProfileSheet";
import { getMyVacationBalance, type VacationBalance } from "../../leave-requests/services/leaveRequestService";
import { useProfileSheet } from "../hooks/useProfileSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { EmploymentTimeline } from "./EmploymentTimeline";
import { useAuth } from "../../session/AuthContext";
import { listEmploymentEvents, updateMyProfile } from "../services/profileService";
import { listMyActs } from "../services/actsService";
import { EmployeeActsCard } from "./EmployeeActsCard";
import type { AdministrativeAct, EmploymentEvent } from "../../../lib/database.types";

/** Contenido de la sección "Perfil" de la página Cuenta: datos laborales, ficha,
 *  datos editables, historial y actas. La foto se edita en el encabezado. */
export function ProfileSection() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const eventsQuery = useQuery<EmploymentEvent[]>({ enabled: Boolean(profile), queryKey: ["employment-events", profile?.id], queryFn: () => listEmploymentEvents(profile!.id) });
  const events = eventsQuery.data ?? [];
  const actsQuery = useQuery<AdministrativeAct[]>({ enabled: Boolean(profile), queryKey: ["my-acts", profile?.id], queryFn: () => listMyActs() });
  const sheetQuery = useProfileSheet(profile?.id);
  const email = sheetQuery.data?.sheet?.email ?? null;
  const balanceQuery = useQuery<VacationBalance | null>({ queryKey: ["vacation-balance", profile?.id], queryFn: () => getMyVacationBalance().catch(() => null) });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBirthDate(profile.birth_date ?? "");
    }
  }, [profile]);

  if (!profile) return null;

  const canEditPrivileged = profile.role === "hr_admin" || profile.role === "admin";
  const trimmed = fullName.trim();
  const dirty = trimmed !== profile.full_name || birthDate !== (profile.birth_date ?? "");

  async function handleSave() {
    if (!trimmed || !dirty) return;
    try {
      setIsSaving(true);
      setError(null);
      await updateMyProfile({ birth_date: birthDate || null, full_name: trimmed });
      await refreshProfile();
      setSavedAt(Date.now());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="animate-fade-up rounded-[22px] bg-white p-5 ring-1 ring-slate-200" aria-label="Datos laborales">
        <dl className="divide-y divide-slate-100">
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-sm text-[var(--color-muted)]">Ingreso</dt>
            <dd className="min-w-0 truncate text-right text-sm font-bold text-[var(--color-text)]">{hireLine(profile.hire_date)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-sm text-[var(--color-muted)]">Vacaciones/año</dt>
            <dd className="min-w-0 truncate text-right text-sm font-bold text-[var(--color-text)]">{profile.annual_vacation_days != null ? `${profile.annual_vacation_days} días` : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-sm text-[var(--color-muted)]">Disponibles</dt>
            <dd className="min-w-0 truncate text-right text-sm font-bold text-[var(--color-text)]">{balanceQuery.data ? `${balanceQuery.data.available} días` : "—"}</dd>
          </div>
          {balanceQuery.data && balanceQuery.data.pending > 0 ? (
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="shrink-0 text-sm text-[var(--color-muted)]">En trámite</dt>
              <dd className="min-w-0 truncate text-right text-sm font-bold text-amber-800">{balanceQuery.data.pending} {balanceQuery.data.pending === 1 ? "día" : "días"}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {sheetQuery.data?.sheet ? <ProfileSheet defs={sheetQuery.data.defs} sheet={sheetQuery.data.sheet} /> : null}

      <section className="animate-fade-up stagger space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
        <TextInput label="Nombre completo" onChange={(event) => setFullName(event.target.value)} required value={fullName} />
        <TextInput label="Cumpleaños" onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} />

        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="profile-email">
            Correo
          </label>
          <div className="flex h-13 items-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm text-[var(--color-muted)] ring-1 ring-slate-200">
            <Lock aria-hidden="true" className="size-4" />
            <span className="truncate" id="profile-email">
              {email ?? "—"}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold" htmlFor="profile-job">
            Puesto
          </label>
          <div className="flex h-13 items-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm text-[var(--color-muted)] ring-1 ring-slate-200">
            {!canEditPrivileged ? <Lock aria-hidden="true" className="size-4" /> : null}
            <span className="truncate" id="profile-job">
              {profile.job_title ?? "Sin asignar"}
            </span>
          </div>
          {!canEditPrivileged ? <p className="mt-2 text-xs text-[var(--color-muted)]">Para editar puesto y correo, solicítalo a RH.</p> : null}
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="press w-full" disabled={!dirty || !trimmed || isSaving} onClick={handleSave}>
          {savedAt && !dirty ? <Check aria-hidden="true" className="size-5" /> : null}
          {isSaving ? "Guardando." : savedAt && !dirty ? "Guardado" : "Guardar cambios"}
        </Button>
      </section>

      {events.length > 0 ? (
        <section className="animate-fade-up space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <div className="mb-1 flex items-center gap-2">
            <History aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
            <h3 className="text-lg font-bold">Historial laboral</h3>
          </div>
          <EmploymentTimeline events={events} />
        </section>
      ) : null}

      <EmployeeActsCard acts={actsQuery.data ?? []} />
    </div>
  );
}
