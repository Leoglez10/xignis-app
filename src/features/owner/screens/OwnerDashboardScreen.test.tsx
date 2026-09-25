import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../../components/ui/ConfirmDialog";
import { ToastProvider } from "../../../components/ui/Toast";
import { OwnerDashboardScreen } from "./OwnerDashboardScreen";

const hasDirectReports = vi.fn(() => false);
const reviewRequest = vi.fn();
const oldDate = new Date(Date.now() - 72 * 3_600_000).toISOString();

vi.mock("../hooks/useHasDirectReports", () => ({ useHasDirectReports: () => hasDirectReports() }));
vi.mock("../../manager/hooks/useManagerPendingRequests", () => ({
  useManagerPendingRequests: () => ({
    absences: [],
    error: null,
    isLoading: false,
    pending: [
      {
        created_at: oldDate,
        employee: { full_name: "Ana Pérez" },
        employee_id: "e1",
        end_date: "2026-10-02",
        id: "r1",
        leave_type: "vacation",
        start_date: "2026-10-01",
        status: "pending_manager",
      },
    ],
    refetch: vi.fn(),
    reviewRequest,
    team: [{ avatar_url: null, full_name: "Ana Pérez", id: "e1", job_title: null }],
  }),
}));
vi.mock("../../profiles/services/profileService", () => ({ listEmployees: vi.fn(async () => []) }));
vi.mock("../../admin/services/departmentService", () => ({ listActiveDepartments: vi.fn(async () => []) }));
vi.mock("../../leave-requests/services/leaveRequestService", () => ({
  listAbsencesForEmployeesToday: vi.fn(async () => []),
  listHrLeaveRequests: vi.fn(async () => []),
}));

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ConfirmProvider>
          <MemoryRouter initialEntries={["/owner"]}>
            <OwnerDashboardScreen />
          </MemoryRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("OwnerDashboardScreen", () => {
  beforeEach(() => hasDirectReports.mockReturnValue(false));

  it("sin reportes directos muestra solo el resumen de la empresa", () => {
    renderScreen();
    expect(screen.getByText("Suite del dueño")).toBeInTheDocument();
    expect(screen.getByText("Solicitudes del día")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tu equipo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Empresa · solo lectura" })).not.toBeInTheDocument();
    expect(screen.queryByText("Próximas 3 urgentes")).not.toBeInTheDocument();
  });

  it("con reportes directos combina primero el equipo y luego la empresa en lectura", () => {
    hasDirectReports.mockReturnValue(true);
    renderScreen();
    expect(screen.getByText("Dueño · Jefe")).toBeInTheDocument();

    const teamTitle = screen.getByRole("heading", { level: 2, name: "Tu equipo" });
    const companyTitle = screen.getByRole("heading", { level: 2, name: "Empresa · solo lectura" });
    expect(teamTitle.compareDocumentPosition(companyTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const team = teamTitle.closest("section")!;
    const shortcuts = within(team).getByRole("region", { name: "Accesos directos" });
    for (const label of ["Solicitudes pendientes", "Ausentes hoy", "Equipo"]) expect(shortcuts).toHaveTextContent(label);
    expect(within(team).getByText("1 solicitud con más de 48 h")).toBeInTheDocument();
    expect(within(team).getByRole("heading", { name: "Próximas 3 urgentes" })).toBeInTheDocument();
    expect(within(team).getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(within(team).getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
    expect(within(team).getByText("Cobertura del equipo")).toBeInTheDocument();

    const company = companyTitle.closest("section")!;
    for (const label of ["Ausentes hoy", "Solicitudes del día", "Pendientes por área", "Vacaciones consumidas este mes"]) {
      expect(within(company).getByText(label)).toBeInTheDocument();
    }
    expect(within(company).getByText(/Resumen de toda la empresa/)).toBeInTheDocument();
  });
});
