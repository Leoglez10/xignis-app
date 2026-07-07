import { ArrowLeft, Check, Lock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { logout, routeForRole } from "../../auth/services/authService";
import { useAuth } from "../../session/AuthContext";
import { getCurrentEmail, roleLabel, updateMyProfile } from "../services/profileService";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    getCurrentEmail().then(setEmail).catch(() => setEmail(null));
  }, []);

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
            <div
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-3xl bg-[var(--color-primary)] text-2xl font-black text-[var(--color-primary-contrast)]"
            >
              {initials(profile.full_name) || "?"}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black">{profile.full_name}</h1>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[var(--color-muted)]">
                {roleLabel[profile.role]}
              </span>
            </div>
          </div>
        </section>

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
      </div>
    </main>
  );
}
