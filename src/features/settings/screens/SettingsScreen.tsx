import { ArrowLeft, Bell, Cake, LayoutDashboard, Moon, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Select } from "../../../components/ui/Select";
import { useToast } from "../../../components/ui/Toast";
import { checkForUpdate } from "../../../lib/version";
import { routeForRole } from "../../auth/services/authService";
import { useAuth } from "../../session/AuthContext";
import { usePreferences, type AppPreferences } from "../PreferencesContext";

const version = __APP_VERSION__;
const build = __BUILD_TIME__;

export function SettingsScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const toast = useToast();
  const toggle = (key: keyof AppPreferences) => updatePreferences({ [key]: !preferences[key] });
  const checkUpdate = async () => {
    try {
      const update = await checkForUpdate();
      toast(update ? { message: `La versión ${update.version} está disponible. Recarga para aplicarla.`, title: "Nueva versión", tone: "info" } : { message: "Estás usando la versión más reciente disponible.", tone: "success" });
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : "No se pudo buscar actualizaciones.", tone: "error" });
    }
  };
  return (
    <main className="min-h-dvh bg-[var(--color-background)] text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5 sm:px-6 lg:max-w-5xl">
        <header className="mb-6 flex items-center gap-3">
          <button aria-label="Regresar" className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)]" type="button" onClick={() => navigate(profile ? routeForRole(profile.role) : "/profile")}><ArrowLeft aria-hidden="true" className="size-5" /></button>
          <div><p className="text-sm font-bold text-[var(--color-muted)]">Tu experiencia</p><h2 className="text-3xl font-bold">Configuración</h2></div>
        </header>
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
          <Card className="p-5"><SettingHeading icon={<Moon />} title="Apariencia" /><Select label="Tema" value={preferences.theme} onChange={(event) => updatePreferences({ theme: event.target.value as AppPreferences["theme"] })}><option value="system">Usar el sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></Select><div className="mt-4"><Select label="Idioma" value={preferences.language} onChange={(event) => updatePreferences({ language: event.target.value as AppPreferences["language"] })}><option value="es">Español</option><option value="en">English (preview)</option></Select></div></Card>
          <Card className="p-5"><SettingHeading icon={<Bell />} title="Notificaciones" /><div className="divide-y divide-[var(--color-border)]"><Toggle label="Actualizaciones de solicitudes" checked={preferences.notifyRequests} onChange={() => toggle("notifyRequests")} /><Toggle label="Aprobaciones y rechazos" checked={preferences.notifyApprovals} onChange={() => toggle("notifyApprovals")} /><Toggle label="Cumpleaños y aniversarios" checked={preferences.notifyBirthdays} onChange={() => toggle("notifyBirthdays")} /></div></Card>
          <Card className="p-5"><SettingHeading icon={<LayoutDashboard />} title="Privacidad y tablero" /><Toggle icon={<Cake />} label="Mostrar cumpleaños del equipo" checked={preferences.birthdayVisibility} onChange={() => toggle("birthdayVisibility")} /><Toggle label="Vista compacta del tablero" checked={preferences.dashboardCompact} onChange={() => toggle("dashboardCompact")} /></Card>
          <Card className="p-5"><SettingHeading icon={<PackageOpen />} title="Versión" /><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--color-muted)]">Aplicación</dt><dd className="mt-1 font-bold">v{version}</dd></div><div><dt className="text-[var(--color-muted)]">Build</dt><dd className="mt-1 font-bold">{new Date(build).toLocaleDateString("es-MX")}</dd></div></dl><Button className="mt-5 w-full" variant="secondary" onClick={() => void checkUpdate()}>Buscar actualizaciones</Button></Card>
        </div>
      </div>
    </main>
  );
}

function SettingHeading({ icon, title }: { icon: ReactNode; title: string }) { return <div className="mb-4 flex items-center gap-2"><span aria-hidden="true" className="[&>svg]:size-5">{icon}</span><h3 className="text-lg font-bold">{title}</h3></div>; }
function Toggle({ checked, icon, label, onChange }: { checked: boolean; icon?: ReactNode; label: string; onChange: () => void }) { return <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2"><span className="flex items-center gap-2 text-sm font-bold">{icon ? <span aria-hidden="true">{icon}</span> : null}{label}</span><input checked={checked} className="peer sr-only" type="checkbox" onChange={onChange} /><span aria-hidden="true" className="relative h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-[var(--color-primary-strong)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--color-focus)] after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" /></label>; }
