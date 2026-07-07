import { describe, expect, it } from "vitest";
import { formatDateRange, leaveTypeLabel, statusLabel } from "./leaveRequestService";

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
