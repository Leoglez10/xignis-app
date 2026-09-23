import { describe, expect, it } from "vitest";
import { formatDateRange, leaveTypeLabel, statusLabel, timeRangeHours } from "./leaveRequestService";

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
