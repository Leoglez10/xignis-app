import { describe, expect, it } from "vitest";
import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import { buildAdminRequestRowModel } from "./adminRequestRowModel";

function makeRequest(
  status: LeaveRequestWithEmployee["status"],
  managerId: string | null,
): LeaveRequestWithEmployee {
  return {
    created_at: "2026-07-01T10:00:00Z",
    employee: { avatar_url: null, full_name: "Ana Employee", job_title: null, manager_id: managerId },
    end_date: "2026-07-12",
    id: "req-1",
    leave_type: "vacation",
    reviewed_at: null,
    start_date: "2026-07-09",
    status,
  } as unknown as LeaveRequestWithEmployee;
}

describe("buildAdminRequestRowModel", () => {
  it("marks the HR step active and actionable after manager approval", () => {
    const model = buildAdminRequestRowModel(makeRequest("approved_by_manager", "mgr-1"));
    expect(model.steps).toEqual(["done", "done", "active", "pending"]);
    expect(model.currentStep).toBe(3);
    expect(model.statusText).toBe("Esperando validación de RH");
    expect(model.isActionable).toBe(true);
  });

  it("skips the manager step when the employee has no manager", () => {
    const model = buildAdminRequestRowModel(makeRequest("pending_hr", null));
    expect(model.steps).toEqual(["done", "active", "pending"]);
    expect(model.currentStep).toBe(2);
    expect(model.isActionable).toBe(true);
  });

  it("fills passed steps for closed approved requests and falls back to the status label", () => {
    const model = buildAdminRequestRowModel(makeRequest("approved", "mgr-1"));
    expect(model.steps).toEqual(["done", "done", "done", "done"]);
    expect(model.currentStep).toBe(4);
    expect(model.statusText).toBe("Aprobada");
    expect(model.isActionable).toBe(false);
  });

  it("points at the rejected step for HR rejections", () => {
    const model = buildAdminRequestRowModel(makeRequest("rejected", "mgr-1"));
    expect(model.steps).toEqual(["done", "done", "rejected", "skipped"]);
    expect(model.currentStep).toBe(3);
    expect(model.statusText).toBe("Rechazada");
  });

  it("keeps the employee wording for pending manager approval by default", () => {
    const model = buildAdminRequestRowModel(makeRequest("pending_manager", "mgr-1"));
    expect(model.statusText).toBe("Esperando aprobación de tu jefe");
  });

  it("speaks to the approver in the manager's team list, even without manager_id loaded", () => {
    const model = buildAdminRequestRowModel(makeRequest("pending_manager", null), "approver");
    expect(model.steps).toEqual(["done", "active", "pending", "pending"]);
    expect(model.currentStep).toBe(2);
    expect(model.statusText).toBe("Esperando tu aprobación");
  });
});
