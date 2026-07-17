import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "../services/dashboardService";
export function useDashboardStats() { return useQuery({ queryKey: ["dashboard", "admin", "stats"], queryFn: getAdminDashboardStats }); }
