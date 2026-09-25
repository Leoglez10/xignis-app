import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../../components/ui/ConfirmDialog";
import { ToastProvider } from "../../../components/ui/Toast";
import { PreferencesProvider } from "../../settings/PreferencesContext";
import { AccountScreen } from "./AccountScreen";

const useAuth = vi.fn();
const directReports = vi.fn(() => 0);
vi.mock("../../session/AuthContext", () => ({ useAuth: () => useAuth() }));
vi.mock("../../owner/hooks/useHasDirectReports", () => ({ useDirectReportsCount: () => directReports(), useHasDirectReports: () => directReports() > 0 }));
vi.mock("../../profiles/components/ProfileSection", () => ({ ProfileSection: () => <p>Contenido de perfil</p> }));
vi.mock("../../profiles/components/AvatarPhotoSheet", () => ({ AvatarPhotoSheet: () => null }));
vi.mock("../../auth/services/authService", () => ({ logout: vi.fn() }));
vi.mock("../../profiles/services/profileService", () => ({ removeMyAvatar: vi.fn(), roleLabel: { admin: "Admin", employee: "Empleado", hr_admin: "RH", manager: "Jefe", owner: "Dueño" }, uploadMyAvatar: vi.fn() }));

function renderAt(path: string) {
  return render(
    <PreferencesProvider>
      <ToastProvider>
        <ConfirmProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/cuenta/:section" element={<AccountScreen />} />
            </Routes>
          </MemoryRouter>
        </ConfirmProvider>
      </ToastProvider>
    </PreferencesProvider>,
  );
}

describe("AccountScreen", () => {
  beforeEach(() => {
    directReports.mockReturnValue(0);
    useAuth.mockReturnValue({ profile: { avatar_url: null, full_name: "Owner Test", id: "1", role: "owner" }, refreshProfile: vi.fn() });
  });

  it("muestra encabezado, sub-nav y la sección de perfil por defecto", () => {
    renderAt("/cuenta/perfil");
    expect(screen.getByText("Owner Test")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Secciones de la cuenta" });
    for (const label of ["Perfil", "Apariencia", "Notificaciones", "Privacidad", "Acerca de"]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Apariencia" })).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Contenido de perfil")).toBeInTheDocument();
    const logout = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(nav).not.toContainElement(logout);
  });

  it("muestra 'Dueño' y 'Jefe' al dueño con reportes directos", () => {
    directReports.mockReturnValue(2);
    renderAt("/cuenta/perfil");
    expect(screen.getByText("Dueño")).toBeInTheDocument();
    expect(screen.getByText("Jefe")).toBeInTheDocument();
  });

  it("muestra el rol en un chip para otros roles", () => {
    useAuth.mockReturnValue({ profile: { avatar_url: null, full_name: "Ana", id: "2", role: "employee" }, refreshProfile: vi.fn() });
    renderAt("/cuenta/perfil");
    expect(screen.getByText("Empleado")).toBeInTheDocument();
  });

  it("abre la sección pedida en la URL", () => {
    renderAt("/cuenta/notificaciones");
    expect(screen.getByRole("heading", { level: 2, name: "Notificaciones" })).toBeInTheDocument();
    expect(screen.getByLabelText("Aprobaciones y rechazos")).toBeInTheDocument();
  });

  it("agrupa tema, idioma, sonido y vista compacta en Apariencia", () => {
    renderAt("/cuenta/apariencia");
    expect(screen.getByLabelText("Tema")).toBeInTheDocument();
    expect(screen.getByLabelText("Idioma")).toBeInTheDocument();
    expect(screen.getByLabelText("Sonido al enviar una solicitud")).toBeInTheDocument();
    expect(screen.getByLabelText("Vista compacta del tablero")).toBeInTheDocument();
  });

  it("muestra versión y actualizaciones en Acerca de", () => {
    renderAt("/cuenta/acerca");
    expect(screen.getByRole("button", { name: "Buscar actualizaciones" })).toBeInTheDocument();
  });

  it("redirige una sección desconocida a Perfil", () => {
    renderAt("/cuenta/otra");
    expect(screen.getByText("Contenido de perfil")).toBeInTheDocument();
  });
});
