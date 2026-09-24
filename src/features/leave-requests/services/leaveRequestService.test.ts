import { describe, expect, it } from "vitest";
import type { LeaveRequest } from "../../../lib/database.types";
import {
  __computeVacationBalance,
  formatDateRange,
  leaveTypeLabel,
  statusLabel,
  timeRangeHours,
} from "./leaveRequestService";

describe("leaveTypeLabel", () => {
  it("traduce cada tipo de permiso", () => {
    expect(leaveTypeLabel.vacation).toBe("Vacaciones");
    expect(leaveTypeLabel.sick).toBe("Enfermedad");
    expect(leaveTypeLabel.personal).toBe("Personal");
    expect(leaveTypeLabel.other).toBe("Otro");
  });
});

describe("statusLabel", () => {
  it("traduce el flujo de estados", () => {
    expect(statusLabel.pending_manager).toBe("Pendiente jefe");
    expect(statusLabel.approved_by_manager).toBe("Aprobada por jefe");
    expect(statusLabel.pending_hr).toBe("Pendiente RH");
    expect(statusLabel.approved).toBe("Aprobada");
    expect(statusLabel.rejected).toBe("Rechazada");
  });
});

describe("formatDateRange", () => {
  it("muestra una sola fecha cuando inicio y fin coinciden", () => {
    expect(formatDateRange({ start_date: "2026-07-10", end_date: "2026-07-10" })).toBe("2026-07-10");
  });

  it("muestra el rango cuando difieren", () => {
    expect(formatDateRange({ start_date: "2026-07-10", end_date: "2026-07-12" })).toBe("2026-07-10 - 2026-07-12");
  });
});

describe("timeRangeHours", () => {
  it("calcula un rango simple de horas", () => {
    expect(timeRangeHours("09:00", "13:00")).toBe(4);
  });

  it("maneja horas fraccionarias", () => {
    expect(timeRangeHours("09:00", "13:30")).toBe(4.5);
  });

  it("devuelve cero cuando fin e inicio coinciden", () => {
    expect(timeRangeHours("10:00", "10:00")).toBe(0);
  });

  it("devuelve cero cuando el fin es anterior al inicio", () => {
    expect(timeRangeHours("14:00", "09:00")).toBe(0);
  });

  it("devuelve cero si faltan valores", () => {
    expect(timeRangeHours("", "14:00")).toBe(0);
    expect(timeRangeHours("09:00", "")).toBe(0);
  });
});

function fakeLeaveRequest(overrides: Partial<LeaveRequest>): LeaveRequest {
  return {
    coverage_contact: null,
    created_at: "2026-01-01T00:00:00Z",
    employee_id: "emp-1",
    end_date: "2026-07-10",
    end_time: null,
    folio: "F-001",
    id: "req-1",
    leave_type: "vacation",
    paid: true,
    pending_tasks: null,
    rejection_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    schedule_type: "full_day",
    start_date: "2026-07-10",
    start_time: null,
    status: "pending_manager",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("__computeVacationBalance", () => {
  const currentYear = new Date().getFullYear();

  it("devuelve ceros cuando no hay perfil", () => {
    const result = __computeVacationBalance(null, []);
    expect(result).toEqual({ available: 0, pending: 0, quota: 0, taken: 0, year: currentYear });
  });

  it("calcula saldo disponible restando días aprobados de la cuota", () => {
    const profile = { annual_vacation_days: 15 };
    const requests = [
      fakeLeaveRequest({
        id: "r1",
        leave_type: "vacation",
        status: "approved",
        start_date: `${currentYear}-03-01`,
        end_date: `${currentYear}-03-05`,
        paid: true,
      }),
    ];
    const result = __computeVacationBalance(profile, requests);
    expect(result.quota).toBe(15);
    expect(result.taken).toBe(5);
    expect(result.available).toBe(10);
    expect(result.pending).toBe(0);
  });

  it("suma días pendientes aparte sin restarlos del disponible", () => {
    const profile = { annual_vacation_days: 10 };
    const requests = [
      fakeLeaveRequest({
        id: "r1",
        leave_type: "vacation",
        status: "approved",
        start_date: `${currentYear}-02-01`,
        end_date: `${currentYear}-02-03`,
        paid: true,
      }),
      fakeLeaveRequest({
        id: "r2",
        leave_type: "vacation",
        status: "pending_manager",
        start_date: `${currentYear}-04-01`,
        end_date: `${currentYear}-04-02`,
        paid: true,
      }),
    ];
    const result = __computeVacationBalance(profile, requests);
    expect(result.taken).toBe(3);
    expect(result.pending).toBe(2);
    expect(result.available).toBe(7);
  });

  it("ignora permisos sin goce, no vacaciones y estados rechazados/cancelados", () => {
    const profile = { annual_vacation_days: 10 };
    const requests = [
      fakeLeaveRequest({ id: "r1", leave_type: "vacation", status: "approved", paid: false }),
      fakeLeaveRequest({ id: "r2", leave_type: "sick", status: "approved" }),
      fakeLeaveRequest({ id: "r3", leave_type: "vacation", status: "rejected" }),
      fakeLeaveRequest({ id: "r4", leave_type: "vacation", status: "cancelled" }),
    ];
    const result = __computeVacationBalance(profile, requests);
    expect(result.taken).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.available).toBe(10);
  });

  it("no resta días aprobados de años distintos", () => {
    const profile = { annual_vacation_days: 10 };
    const requests = [
      fakeLeaveRequest({
        id: "r1",
        leave_type: "vacation",
        status: "approved",
        start_date: `${currentYear - 1}-12-28`,
        end_date: `${currentYear - 1}-12-31`,
      }),
      fakeLeaveRequest({
        id: "r2",
        leave_type: "vacation",
        status: "approved",
        start_date: `${currentYear + 1}-01-02`,
        end_date: `${currentYear + 1}-01-05`,
      }),
    ];
    const result = __computeVacationBalance(profile, requests);
    expect(result.taken).toBe(0);
    expect(result.available).toBe(10);
  });

  it("nunca devuelve disponible negativo", () => {
    const profile = { annual_vacation_days: 5 };
    const requests = [
      fakeLeaveRequest({
        id: "r1",
        leave_type: "vacation",
        status: "approved",
        start_date: `${currentYear}-07-01`,
        end_date: `${currentYear}-07-10`,
      }),
    ];
    const result = __computeVacationBalance(profile, requests);
    expect(result.taken).toBe(10);
    expect(result.available).toBe(0);
  });
});
