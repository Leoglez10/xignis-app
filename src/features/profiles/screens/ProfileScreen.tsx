import { ArrowLeft, Check, History, Lock, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { ProfileSheet } from "../components/ProfileSheet";
import { useProfileSheet } from "../hooks/useProfileSheet";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { EmploymentTimeline } from "../components/EmploymentTimeline";
import { logout, routeForRole } from "../../auth/services/authService";
import { useAuth } from "../../session/AuthContext";
import { getCurrentEmail, listEmploymentEvents, roleLabel, updateMyProfile } from "../services/profileService";
import type { EmploymentEvent } from "../../../lib/database.types";
import { useConfirm } from "../../../components/ui/ConfirmDialog";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const confirm = useConfirm();
  const emailQuery = useQuery<string | null>({ queryKey: ["profile-email", profile?.id], queryFn: getCurrentEmail });
  const eventsQuery = useQuery<EmploymentEvent[]>({ enabled: Boolean(profile), queryKey: ["employment-events", profile?.id], queryFn: () => listEmploymentEvents(profile!.id) });
  const email = emailQuery.data ?? null;
  const events = eventsQuery.data ?? [];
  const sheetQuery = useProfileSheet(profile?.id);

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
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
  const dirty = trimmed !== profile.full_name;

  async function handleSave() {
    if (!trimmed || !dirty) return;
    try {
      setIsSaving(true);
      setError(null);
      await updateMyProfile({ full_name: trimmed });
      await refreshProfile();
      setSavedAt(Date.now());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
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
      <div className="mx-auto w-full max-w-xl px-4 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] md:py-8">
        <header className="animate-fade-up mb-5 flex items-center justify-between gap-3">
          <button
            className="press inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black ring-1 ring-slate-200"
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

        <section className="animate-fade-up rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <Avatar
              className="bg-[var(--color-primary)] text-2xl text-[var(--color-primary-contrast)]"
              name={profile.full_name}
              shape="rounded-3xl"
              size="size-16"
              src={profile.avatar_url}
            />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">{profile.full_name}</h2>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                {roleLabel[profile.role]}
              </span>
            </div>
          </div>
        </section>

        <button className="press mt-4 flex min-h-14 w-full items-center gap-3 rounded-[22px] bg-white px-5 text-left font-black ring-1 ring-slate-200" type="button" onClick={() => navigate("/settings")}><Settings aria-hidden="true" className="size-5" />Configuración</button>

        {sheetQuery.data?.sheet ? (
          <div className="mt-4">
            <ProfileSheet defs={sheetQuery.data.defs} email={email} sheet={sheetQuery.data.sheet} />
          </div>
        ) : null}

        <section className="animate-fade-up stagger mt-4 space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <TextInput
            label="Nombre completo"
            onChange={(event) => setFullName(event.target.value)}
            required
            value={fullName}
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
              <p className="mt-2 text-xs text-[var(--color-muted)]">El puesto y el rol solo los cambia RH.</p>
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
          <section className="animate-fade-up mt-4 space-y-4 rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
            <div className="mb-1 flex items-center gap-2">
              <History aria-hidden="true" className="size-5 text-[var(--color-muted)]" />
              <h2 className="text-lg font-black">Historial laboral</h2>
            </div>
            <EmploymentTimeline events={events} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
