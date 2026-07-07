import { describe, expect, it } from "vitest";
import { loginRoleMatchesProfile, routeForRole } from "./authService";

describe("routeForRole", () => {
  it("mapea cada rol a su ruta", () => {
    expect(routeForRole("admin")).toBe("/admin");
    expect(routeForRole("hr_admin")).toBe("/admin");
    expect(routeForRole("manager")).toBe("/manager");
    expect(routeForRole("employee")).toBe("/employee");
  });
});

describe("loginRoleMatchesProfile", () => {
  it("RH seleccionado acepta perfiles hr_admin y admin", () => {
    expect(loginRoleMatchesProfile("hr_admin", "hr_admin")).toBe(true);
    expect(loginRoleMatchesProfile("hr_admin", "admin")).toBe(true);
  });

  it("RH seleccionado rechaza empleado o jefe", () => {
    expect(loginRoleMatchesProfile("hr_admin", "employee")).toBe(false);
    expect(loginRoleMatchesProfile("hr_admin", "manager")).toBe(false);
  });

  it("empleado y jefe requieren coincidencia exacta", () => {
    expect(loginRoleMatchesProfile("employee", "employee")).toBe(true);
    expect(loginRoleMatchesProfile("employee", "manager")).toBe(false);
    expect(loginRoleMatchesProfile("manager", "manager")).toBe(true);
    expect(loginRoleMatchesProfile("manager", "admin")).toBe(false);
  });
});
