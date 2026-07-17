import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "./TopBar";
import { axe } from "vitest-axe";

vi.mock("../features/session/AuthContext", () => ({ useAuth: () => ({ profile: { full_name: "María de la Fuente", id: "1", role: "employee" } }) }));
vi.mock("../features/notifications/NotificationBell", () => ({ NotificationBell: () => <button>Notificaciones</button> }));
vi.mock("./ModuleSwitcherSheet", () => ({ ModuleSwitcherSheet: () => null }));
vi.mock("../lib/useScrollDirection", () => ({ useScrollDirection: () => false }));

describe("TopBar", () => {
  it("muestra un solo h1 y navegación del rol", () => {
    render(<MemoryRouter initialEntries={["/employee"]}><TopBar /><main id="main-content" /></MemoryRouter>);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Secciones" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mi perfil" })).toHaveTextContent("MF");
  });
  it("no presenta violaciones axe en su estado base", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/employee"]}><TopBar /><main id="main-content" /></MemoryRouter>);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
