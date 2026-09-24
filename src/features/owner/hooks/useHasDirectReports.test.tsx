import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDirectReportsCount, useHasDirectReports } from "./useHasDirectReports";

const countDirectReports = vi.fn();
vi.mock("../../profiles/services/profileService", () => ({
  countDirectReports: (id: string) => countDirectReports(id),
}));
vi.mock("../../session/AuthContext", () => ({ useAuth: () => ({ profile: { id: "owner-1", role: "owner" } }) }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useHasDirectReports", () => {
  beforeEach(() => countDirectReports.mockReset());

  it("es true cuando alguien tiene al usuario como jefe directo", async () => {
    countDirectReports.mockResolvedValue(2);
    const { result } = renderHook(() => useHasDirectReports(), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
    expect(countDirectReports).toHaveBeenCalledWith("owner-1");
  });

  it("es false sin reportes directos", async () => {
    countDirectReports.mockResolvedValue(0);
    const { result } = renderHook(() => useHasDirectReports(), { wrapper });
    await waitFor(() => expect(countDirectReports).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it("expone el número de reportes directos", async () => {
    countDirectReports.mockResolvedValue(3);
    const { result } = renderHook(() => useDirectReportsCount(), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));
  });

  it("no consulta cuando está deshabilitado", () => {
    const { result } = renderHook(() => useHasDirectReports({ enabled: false }), { wrapper });
    expect(result.current).toBe(false);
    expect(countDirectReports).not.toHaveBeenCalled();
  });
});
