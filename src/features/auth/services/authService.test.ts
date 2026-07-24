import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccountStatus, routeForRole } from "./authService";

const invoke = vi.fn();

vi.mock("../../../lib/supabase", () => ({
  getSupabaseClient: () => ({ functions: { invoke } }),
}));

describe("routeForRole", () => {
  it("mapea cada rol a su ruta", () => {
    expect(routeForRole("admin")).toBe("/admin");
    expect(routeForRole("hr_admin")).toBe("/admin");
    expect(routeForRole("manager")).toBe("/manager");
    expect(routeForRole("employee")).toBe("/employee");
  });
});

describe("getAccountStatus", () => {
  beforeEach(() => invoke.mockReset());

  it("devuelve el estado que responde la Edge Function", async () => {
    invoke.mockResolvedValue({ data: { status: "pending" }, error: null });
    await expect(getAccountStatus("ana@empresa.com")).resolves.toBe("pending");
    expect(invoke).toHaveBeenCalledWith("account-access", {
      body: { action: "status", email: "ana@empresa.com" },
    });
  });

  it("propaga el mensaje real del body cuando la respuesta no es 2xx", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("non-2xx"), {
        context: new Response(JSON.stringify({ error: "Correo inválido." }), { status: 400 }),
      }),
    });
    await expect(getAccountStatus("roto")).rejects.toThrow("Correo inválido.");
  });

  it("cae al mensaje genérico si el body no es JSON", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("non-2xx"), {
        context: new Response("boom", { status: 500 }),
      }),
    });
    await expect(getAccountStatus("ana@empresa.com")).rejects.toThrow("non-2xx");
  });
});
