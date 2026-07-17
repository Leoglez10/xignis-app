import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof Error && /401|403|no autorizado/i.test(error.message)) return false;
        return failureCount < 2;
      },
      staleTime: 30 * 1000,
    },
    mutations: { retry: false },
  },
});

export const queryKeys = {
  dashboard: (role: string, userId?: string) => ["dashboard", role, userId ?? "anonymous"] as const,
  leaveRequests: (scope: string, userId?: string) => ["leave-requests", scope, userId ?? "anonymous"] as const,
  notifications: (userId?: string) => ["notifications", userId ?? "anonymous"] as const,
  profile: (userId?: string) => ["profile", userId ?? "current"] as const,
  settings: ["settings"] as const,
};
