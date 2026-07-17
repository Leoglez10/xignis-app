import { describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/date", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/date")>()), todayIso: () => "2026-07-12" }));
import { requestSchema } from "./LeaveRequestScreen";

describe("wizard de permisos", () => {
  it("acepta un borrador completo válido", () => {
    expect(requestSchema.safeParse({ coverageContact: "Ana", endDate: "2026-07-14", endTime: "", leaveType: "vacation", paid: true, pendingTasks: "Entrega documentada", scheduleType: "full_day", startDate: "2026-07-13", startTime: "" }).success).toBe(true);
  });
  it("rechaza fechas pasadas y rangos horarios invertidos", () => {
    const result = requestSchema.safeParse({ coverageContact: "", endDate: "2026-07-11", endTime: "09:00", leaveType: "personal", paid: false, pendingTasks: "", scheduleType: "time_range", startDate: "2026-07-11", startTime: "10:00" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["startDate", "endTime"]));
  });
});
