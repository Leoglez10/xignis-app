import { ArrowLeft, Camera, Check, History, Lock, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ZoomableAvatar } from "../../../components/ui/ZoomableAvatar";
import { hireLine, ProfileSheet } from "../components/ProfileSheet";
import { getMyVacationBalance, type VacationBalance } from "../../leave-requests/services/leaveRequestService";
import { useProfileSheet } from "../hooks/useProfileSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { EmploymentTimeline } from "../components/EmploymentTimeline";
import { logout, routeForRole } from "../../auth/services/authService";
import { useAuth } from "../../session/AuthContext";
import { AvatarPhotoSheet } from "../components/AvatarPhotoSheet";
import { listEmploymentEvents, removeMyAvatar, roleLabel, updateMyProfile, uploadMyAvatar } from "../services/profileService";
import { listMyActs } from "../services/actsService";
import { EmployeeActsCard } from "../components/EmployeeActsCard";
import type { AdministrativeAct, EmploymentEvent } from "../../../lib/database.types";
import { useConfirm } from "../../../components/ui/ConfirmDialog";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  const confirm = useConfirm();
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

  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 pt-[env(safe-area-inset-top)] text-[var(--color-text)]" id="main-content" tabIndex={-1}>
        <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando perfil.</p>
      </main>
    );
  }

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

  async function handleAvatarConfirm(image: Blob) {
    try {
      setAvatarBusy(true);
      setAvatarError(null);
      await uploadMyAvatar(image);
      await refreshProfile();
      setIsPhotoSheetOpen(false);
    } catch (uploadError) {
      setAvatarError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la foto.");
      setIsPhotoSheetOpen(false);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarRemove() {
    const accepted = await confirm({ confirmLabel: "Quitar", description: "Volverás a ver tus iniciales.", title: "¿Quitar tu foto?" });
    if (!accepted) return;
    try {
      setAvatarBusy(true);
      setAvatarError(null);
      await removeMyAvatar();
      await refreshProfile();
    } catch (removeError) {
      setAvatarError(removeError instanceof Error ? removeError.message : "No se pudo quitar la foto.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleLogout() {
    const accepted = await confirm({ confirmLabel: "Cerrar sesión", description: "Tendrás que identificarte nuevamente para entrar.", title: "¿Cerrar sesión?" });
    if (!accepted) return;
    await logout();
    navigate("/login");
  }

  return (
    <main className="min-h-dvh bg-slate-100 text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-xl px-4 pb-5 pt-5 md:py-8 lg:max-w-5xl">
        <header className="animate-fade-up mb-5 flex items-center justify-between gap-3">
          <button
            className="press inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold ring-1 ring-slate-200"
            onClick={() => navigate(routeForRole(profile.role))}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver
          </button>
          <button
            className="press inline-flex size-11 items-center justify-center rounded-full bg-white text-red-600 ring-1 ring-slate-200"
            onClick={handleLogout}
            type="button"
          >
            <span className="sr-only">Cerrar sesion</span>
            <LogOut aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="space-y-4 lg:sticky lg:top-8">
        <section className="animate-fade-up rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <ZoomableAvatar
                className="bg-[var(--color-primary)] text-2xl text-[var(--color-primary-contrast)]"
                isRemoving={avatarBusy}
                name={profile.full_name}
                onRemove={handleAvatarRemove}
                shape="rounded-3xl"
                size="size-20"
                src={profile.avatar_url}
              />
              <button
                className="press absolute -bottom-2.5 -right-2.5 grid size-7 place-items-center rounded-full bg-white text-[var(--color-primary)] ring-1 ring-slate-200"
                disabled={avatarBusy}
                onClick={() => setIsPhotoSheetOpen(true)}
                type="button"
              >
                <Camera aria-hidden="true" className="size-3.5" />
                <span className="sr-only">{profile.avatar_url ? "Cambiar foto de perfil" : "Subir foto de perfil"}</span>
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold">{profile.full_name}</h2>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--color-muted)]">
                {roleLabel[profile.role]}
              </span>
            </div>
          </div>

          {avatarError ? (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
              {avatarError}
            </p>
          ) : null}

          <AvatarPhotoSheet
            isOpen={isPhotoSheetOpen}
            isSaving={avatarBusy}
            onClose={() => setIsPhotoSheetOpen(false)}
            onConfirm={handleAvatarConfirm}
          />
        </section>

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

        <button className="press flex min-h-14 w-full items-center gap-3 rounded-[22px] bg-white px-5 text-left font-bold ring-1 ring-slate-200" type="button" onClick={() => navigate("/settings")}><Settings aria-hidden="true" className="size-5" />Configuración</button>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
        {sheetQuery.data?.sheet ? (
          <ProfileSheet defs={sheetQuery.data.defs} sheet={sheetQuery.data.sheet} />
        ) : null}

        <section className="animate-fade-up stagger space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <TextInput
            label="Nombre completo"
            onChange={(event) => setFullName(event.target.value)}
            required
            value={fullName}
          />

          <TextInput
            label="Cumpleaños"
            onChange={(event) => setBirthDate(event.target.value)}
            type="date"
            value={birthDate}
          />

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
            {!canEditPrivileged ? (
              <p className="mt-2 text-xs text-[var(--color-muted)]">Para editar puesto y correo, solicítalo a RH.</p>
            ) : null}
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
              <h2 className="text-lg font-bold">Historial laboral</h2>
            </div>
            <EmploymentTimeline events={events} />
          </section>
        ) : null}

        <EmployeeActsCard acts={actsQuery.data ?? []} />
        </div>
        </div>
      </div>
    </main>
  );
}
