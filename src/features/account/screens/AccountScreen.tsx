import { Camera, LogOut } from "lucide-react";
import { useState, type ComponentType } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import { RoleChips } from "../../../components/RoleChips";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { ZoomableAvatar } from "../../../components/ui/ZoomableAvatar";
import { logout } from "../../auth/services/authService";
import { useDirectReportsCount } from "../../owner/hooks/useHasDirectReports";
import { AvatarPhotoSheet } from "../../profiles/components/AvatarPhotoSheet";
import { ProfileSection } from "../../profiles/components/ProfileSection";
import { removeMyAvatar, uploadMyAvatar } from "../../profiles/services/profileService";
import { useAuth } from "../../session/AuthContext";
import { AboutSection, AppearanceSection, NotificationsSection, PrivacySection } from "../../settings/components/PreferenceSections";
import { accountPath, accountSections, isAccountSection, type AccountSectionId } from "../accountSections";

const sectionContent: Record<AccountSectionId, ComponentType> = {
  perfil: ProfileSection,
  apariencia: AppearanceSection,
  notificaciones: NotificationsSection,
  privacidad: PrivacySection,
  acerca: AboutSection,
};

/**
 * Página "Cuenta" (todos los roles): perfil y ajustes con un sub-nav interno.
 * La sección vive en la URL (`/cuenta/:section`) para que los deep links y el
 * botón atrás funcionen. En escritorio el sub-nav es una lista lateral; en
 * móvil, una fila deslizable como las tabs de la TopBar.
 */
export function AccountScreen() {
  const { section } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { profile } = useAuth();

  if (!isAccountSection(section)) return <Navigate replace to={accountPath()} />;
  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--color-background)] text-[var(--color-text)]" id="main-content" tabIndex={-1}>
        <p className="text-sm font-semibold text-[var(--color-muted)]">Cargando cuenta.</p>
      </main>
    );
  }

  const current = accountSections.find((s) => s.id === section)!;
  const Content = sectionContent[section];

  async function handleLogout() {
    const accepted = await confirm({ confirmLabel: "Cerrar sesión", description: "Tendrás que identificarte nuevamente para entrar.", title: "¿Cerrar sesión?" });
    if (!accepted) return;
    await logout();
    navigate("/login");
  }

  const logoutButton = (className: string) => (
    <button className={`press flex items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-red-600 hover:bg-[var(--card-bg)] ${className}`} type="button" onClick={() => void handleLogout()}>
      <LogOut aria-hidden="true" className="size-4.5 shrink-0" />
      Cerrar sesión
    </button>
  );

  return (
    <main className="min-h-dvh bg-[var(--color-background)] text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-5 md:py-8 lg:max-w-5xl">
        <AccountHeader />

        <div className="mt-5 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:items-start md:gap-6">
          <nav aria-label="Secciones de la cuenta" className="md:sticky md:top-8">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:block md:space-y-0.5 md:overflow-visible md:px-0 md:pb-0">
              {accountSections.map(({ id, label, icon: Icon }) => (
                <li className="shrink-0" key={id}>
                  <NavLink
                    to={accountPath(id)}
                    className={({ isActive }) =>
                      `press flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-[var(--card-bg)] text-[var(--color-text)] shadow-sm ring-1 ring-[var(--card-border)]"
                          : "text-[var(--color-muted)] hover:bg-[var(--card-bg)]"
                      }`
                    }
                  >
                    <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                    {label}
                  </NavLink>
                </li>
              ))}
              <li className="hidden md:block">{logoutButton("min-h-10 w-full py-2")}</li>
            </ul>
          </nav>

          <section aria-labelledby="account-section-title" className="mt-4 md:mt-0">
            <h2 className="mb-3 text-xl font-bold" id="account-section-title">{current.label}</h2>
            <Content />
            <div className="mt-6 md:hidden">{logoutButton("min-h-12 w-full justify-center rounded-[22px] bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]")}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** Encabezado compacto: avatar (con edición de foto), nombre y chips de rol. */
function AccountHeader() {
  const { profile, refreshProfile } = useAuth();
  const confirm = useConfirm();
  const directReports = useDirectReportsCount({ enabled: profile?.role === "owner" });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false);
  if (!profile) return null;

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

  return (
    <header className="animate-fade-up rounded-[22px] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ZoomableAvatar
            className="bg-[var(--color-primary)] text-lg text-[var(--color-primary-contrast)]"
            isRemoving={avatarBusy}
            name={profile.full_name}
            onRemove={handleAvatarRemove}
            shape="rounded-2xl"
            size="size-14"
            src={profile.avatar_url}
          />
          <button
            className="press absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-full bg-[var(--card-bg)] text-[var(--color-primary)] ring-1 ring-[var(--card-border)]"
            disabled={avatarBusy}
            onClick={() => setIsPhotoSheetOpen(true)}
            type="button"
          >
            <Camera aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{profile.avatar_url ? "Cambiar foto de perfil" : "Subir foto de perfil"}</span>
          </button>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{profile.full_name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <RoleChips directReports={directReports} role={profile.role} />
          </div>
        </div>
      </div>
      {avatarError ? (
        <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
          {avatarError}
        </p>
      ) : null}
      <AvatarPhotoSheet isOpen={isPhotoSheetOpen} isSaving={avatarBusy} onClose={() => setIsPhotoSheetOpen(false)} onConfirm={handleAvatarConfirm} />
    </header>
  );
}
