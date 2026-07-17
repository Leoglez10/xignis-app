import { describe, expect, it } from "vitest";
import { routeForRole } from "./authService";

describe("routeForRole", () => {
  it("mapea cada rol a su ruta", () => {
    expect(routeForRole("admin")).toBe("/admin");
    expect(routeForRole("hr_admin")).toBe("/admin");
    expect(routeForRole("manager")).toBe("/manager");
    expect(routeForRole("employee")).toBe("/employee");
  });
});
