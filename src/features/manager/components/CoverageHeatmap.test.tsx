import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "../../../lib/database.types";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { CoverageHeatmap } from "./CoverageHeatmap";

const listTeamAbsencesInRange = vi.fn();
vi.mock("../../leave-requests/services/leaveRequestService", () => ({
  listTeamAbsencesInRange: (...args: unknown[]) => listTeamAbsencesInRange(...args),
}));

const members = [
  { full_name: "Ana Pérez", id: "e1" },
  { full_name: "Luis Gil", id: "e2" },
] as Profile[];

function absence(id: string, employeeId: string, start: string, end: string) {
  return { employee_id: employeeId, end_date: end, id, leave_type: "vacation", start_date: start } as LeaveRequestWithEmployee;
}

function renderCard(absences: LeaveRequestWithEmployee[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CoverageHeatmap absences={absences} members={members} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CoverageHeatmap mini calendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
    listTeamAbsencesInRange.mockReset().mockResolvedValue([]);
  });
  afterEach(() => vi.useRealTimers());

  it("renders the visible month Monday-first with coverage per day", () => {
    renderCard([absence("r1", "e1", "2026-09-28", "2026-09-28"), absence("r2", "e2", "2026-09-29", "2026-09-29")]);
    expect(screen.getByText("Septiembre de 2026")).toBeInTheDocument();
    const days = screen.getAllByRole("button", { name: /disponibles$/ });
    expect(days).toHaveLength(42);
    expect(days[0]).toHaveAccessibleName("L 31: 2 de 2 disponibles");
    expect(screen.getByRole("button", { name: "L 28: 1 de 2 disponibles" })).toHaveAttribute("data-coverage", "low");
    expect(screen.getByRole("button", { name: "V 25: 2 de 2 disponibles" })).toHaveAttribute("data-coverage", "full");
    expect(screen.getByRole("link", { name: /Ver agenda/ })).toHaveAttribute("href", "/manager/calendar");
  });

  it("fetches the visible grid range from the Agenda service and scopes it to the team", async () => {
    listTeamAbsencesInRange.mockResolvedValue([
      absence("r3", "e1", "2026-09-02", "2026-09-02"),
      absence("r4", "x9", "2026-09-02", "2026-09-02"), // no es reporte directo
    ]);
    renderCard();
    expect(listTeamAbsencesInRange).toHaveBeenCalledWith("2026-08-31", "2026-10-11");
    const day = await screen.findByRole("button", { name: "X 2: 1 de 2 disponibles" });
    expect(day).toHaveAttribute("data-coverage", "low");
  });

  it("shows who is out for the tapped day", () => {
    renderCard([absence("r1", "e1", "2026-09-28", "2026-09-28")]);
    fireEvent.click(screen.getByRole("button", { name: "L 28: 1 de 2 disponibles" }));
    expect(screen.getByText("1 de 2 disponibles")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "M 29: 2 de 2 disponibles" }));
    expect(screen.getByText("Todo el equipo disponible este día.")).toBeInTheDocument();
  });

  it("navigates months and returns with Hoy", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.getByText("Octubre de 2026")).toBeInTheDocument();
    expect(listTeamAbsencesInRange).toHaveBeenLastCalledWith("2026-09-28", "2026-11-08");
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    expect(screen.getByText("Agosto de 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect(screen.getByText("Septiembre de 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "V 25: 2 de 2 disponibles" })).toHaveAttribute("aria-pressed", "true");
  });
});
