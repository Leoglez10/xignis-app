import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setOwnerViewMode } from "../features/owner/ownerViewMode";
import { TopBar } from "./TopBar";

const directReports = vi.fn(() => 0);
vi.mock("../features/session/AuthContext", () => ({ useAuth: () => ({ profile: { full_name: "Owner Test", id: "1", role: "owner" } }) }));
vi.mock("../features/notifications/NotificationBell", () => ({ NotificationBell: () => <button>Notificaciones</button> }));
vi.mock("./ModuleSwitcherSheet", () => ({ ModuleSwitcherSheet: () => null }));
vi.mock("../lib/useScrollDirection", () => ({ useScrollDirection: () => false }));
vi.mock("../features/owner/hooks/useHasDirectReports", () => ({ useDirectReportsCount: () => directReports(), useHasDirectReports: () => directReports() > 0 }));

function Where() {
  return <p>at:{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
      <Where />
      <main id="main-content" />
    </MemoryRouter>,
  );
}

function sectionLinks() {
  return screen.getAllByRole("link").map((link) => link.textContent);
}

describe("TopBar del dueño", () => {
  beforeEach(() => {
    directReports.mockReturnValue(0);
    setOwnerViewMode("owner");
  });

  it("sin reportes directos muestra solo el chip 'Dueño', sin toggle", () => {
    renderAt("/owner");
    expect(screen.getByText("Dueño")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Vista" })).not.toBeInTheDocument();
  });

  it("con reportes directos reemplaza los chips por el toggle de vista", () => {
    directReports.mockReturnValue(3);
    renderAt("/owner");
    const owner = screen.getByRole("button", { name: "Dueño + Jefe" });
    const team = screen.getByRole("button", { name: "Jefe · 3" });
    expect(owner).toHaveAttribute("aria-pressed", "true");
    expect(team).toHaveAttribute("aria-pressed", "false");
    expect(sectionLinks()).toContain("Empleados");
  });

  it("la vista 'Jefe' deja solo el equipo en las tabs y sale de las páginas de empresa", () => {
    directReports.mockReturnValue(3);
    renderAt("/owner/employees");
    fireEvent.click(screen.getByRole("button", { name: "Jefe · 3" }));
    expect(screen.getByRole("button", { name: "Jefe · 3" })).toHaveAttribute("aria-pressed", "true");
    expect(sectionLinks()).toEqual(["Inicio", "Aprobaciones", "Equipo", "Agenda"]);
    expect(screen.getByText("at:/manager")).toBeInTheDocument();
  });

  it("recuerda la vista por dispositivo", () => {
    directReports.mockReturnValue(3);
    renderAt("/manager/requests");
    fireEvent.click(screen.getByRole("button", { name: "Jefe · 3" }));
    expect(localStorage.getItem("xignis.owner-view:v1")).toBe("team");
    expect(screen.getByText("at:/manager/requests")).toBeInTheDocument();
  });
});
