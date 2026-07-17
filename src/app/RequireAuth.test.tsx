import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAuth } from "./RequireAuth";

const useAuth = vi.fn();
vi.mock("../features/session/AuthContext", () => ({ useAuth: () => useAuth() }));
function Login() { const location = useLocation(); return <div>Login:{(location.state as { from?: { pathname?: string } } | null)?.from?.pathname}</div>; }
function renderRoute() { return render(<MemoryRouter initialEntries={["/employee/requests"]}><Routes><Route path="/login" element={<Login />} /><Route path="/employee/requests" element={<RequireAuth allowedRoles={["employee"]}><div>Privado</div></RequireAuth>} /></Routes></MemoryRouter>); }

describe("RequireAuth", () => {
  beforeEach(() => useAuth.mockReset());
  it("conserva el destino al redirigir sin perfil", () => {
    useAuth.mockReturnValue({ isConfigured: true, isLoading: false, profile: null, session: { user: {} } });
    renderRoute();
    expect(screen.getByText("Login:/employee/requests")).toBeInTheDocument();
  });
  it("renderiza contenido autorizado", () => {
    useAuth.mockReturnValue({ isConfigured: true, isLoading: false, profile: { role: "employee" }, session: { user: {} } });
    renderRoute();
    expect(screen.getByText("Privado")).toBeInTheDocument();
  });
});
