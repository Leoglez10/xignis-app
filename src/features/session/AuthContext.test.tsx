import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({ supabase: null }));
vi.mock("../profiles/services/profileService", () => ({ getCurrentProfile: vi.fn() }));
import { AuthProvider, useAuth } from "./AuthContext";

function Consumer() {
  const auth = useAuth();
  return <div>{auth.isConfigured ? "configurado" : "sin configurar"}:{auth.isLoading ? "cargando" : "listo"}</div>;
}

describe("AuthContext", () => {
  it("permite modo demo cuando Supabase no está configurado", () => {
    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(screen.getByText("sin configurar:listo")).toBeInTheDocument();
  });
});
