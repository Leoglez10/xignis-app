import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../../components/ui/ConfirmDialog";
import { ToastProvider } from "../../../components/ui/Toast";
import { PreferencesProvider } from "../../settings/PreferencesContext";
import { ManagerDashboardScreen } from "./ManagerDashboardScreen";

const useAuth = vi.fn();
vi.mock("../../session/AuthContext", () => ({ useAuth: () => useAuth() }));
vi.mock("../hooks/useManagerPendingRequests", () => ({
  useManagerPendingRequests: () => ({ absences: [], error: null, isLoading: false, pending: [], refetch: vi.fn(), reviewRequest: vi.fn(), team: [] }),
}));

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PreferencesProvider>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter>
              <ManagerDashboardScreen />
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </PreferencesProvider>
    </QueryClientProvider>,
  );
}

describe("ManagerDashboardScreen hero", () => {
  beforeEach(() => useAuth.mockReset());

  it("muestra 'Jefe' y el nombre del jefe", () => {
    useAuth.mockReturnValue({ profile: { full_name: "Carlos Ruiz", id: "m1", role: "manager" } });
    renderScreen();
    expect(screen.getByText("Jefe")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Carlos" })).toBeInTheDocument();
  });

  it("muestra 'Dueño · Jefe' al dueño en la vista de equipo, no solo 'Dueño'", () => {
    useAuth.mockReturnValue({ profile: { full_name: "Laura Gómez", id: "o1", role: "owner" } });
    renderScreen();
    expect(screen.getByText("Dueño · Jefe")).toBeInTheDocument();
    expect(screen.queryByText("Dueño")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Laura" })).toBeInTheDocument();
  });
});
