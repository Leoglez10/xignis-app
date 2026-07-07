import { describe, expect, it } from "vitest";
import { roleLabel } from "./profileService";

describe("roleLabel", () => {
  it("traduce cada rol al espanol del producto", () => {
    expect(roleLabel.admin).toBe("Admin");
    expect(roleLabel.employee).toBe("Empleado");
    expect(roleLabel.hr_admin).toBe("RH");
    expect(roleLabel.manager).toBe("Jefe");
  });
});
