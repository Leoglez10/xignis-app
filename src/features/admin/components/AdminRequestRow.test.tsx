import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { AdminRequestRow } from "./AdminRequestRow";

const request = {
  created_at: "2026-09-01T10:00:00Z",
  employee: { avatar_url: null, full_name: "Ana Employee", job_title: null, manager_id: "mgr-1" },
  end_date: "2026-09-29",
  id: "req-1",
  leave_type: "vacation",
  reviewed_at: null,
  start_date: "2026-09-24",
  status: "approved_by_manager",
} as unknown as LeaveRequestWithEmployee;

describe("AdminRequestRow", () => {
  it("muestra 'Revisar' a RH cuando la solicitud espera su validación", () => {
    render(<ul><AdminRequestRow onClick={vi.fn()} request={request} /></ul>);
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("en solo lectura conserva el stepper y cambia la acción por 'Ver'", () => {
    render(<ul><AdminRequestRow onClick={vi.fn()} readOnly request={request} /></ul>);
    expect(screen.queryByText("Revisar")).not.toBeInTheDocument();
    expect(screen.getByText("Ver")).toBeInTheDocument();
    expect(screen.getByText(/Etapa \d de \d/)).toBeInTheDocument();
  });
});
