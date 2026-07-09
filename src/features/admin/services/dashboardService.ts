import type { LeaveRequest, LeaveType, Profile } from "../../../lib/database.types";
import { listHrLeaveRequests } from "../../leave-requests/services/leaveRequestService";
import { listEmployees } from "../../profiles/services/profileService";

export type AdminDashboardStats = {
  activeEmployees: number;
  approvedThisMonth: number;
  approvalRate30d: number;
  approvedLastMonth: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  totalEmployees: number;
  utilizationPct: number;
};

export type MonthlyTrend = Array<{ approved: number; month: string; pending: number; rejected: number }>;

export type TypeDistribution = Array<{ count: number; type: LeaveType }>;

const monthKey = (iso: string) => iso.slice(0, 7);

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [requests, employees] = await Promise.all([listHrLeaveRequests(), listEmployees()]);
  const now = new Date();
  const thisMonth = monthKey(now.toISOString());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = monthKey(lastMonthDate.toISOString());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const pending = requests.filter(
    (r) => r.status === "pending_hr" || r.status === "approved_by_manager",
  );
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected" || r.status === "rejected_by_manager");

  const approvedThisMonth = approved.filter((r) => monthKey(r.created_at) === thisMonth).length;
  const approvedLastMonth = approved.filter((r) => monthKey(r.created_at) === lastMonth).length;

  const closed30 = requests.filter(
    (r) =>
      (r.status === "approved" || r.status === "rejected" || r.status === "rejected_by_manager") &&
      r.created_at >= thirtyDaysAgo,
  );
  const approved30 = closed30.filter((r) => r.status === "approved").length;
  const approvalRate30d = closed30.length === 0 ? 0 : Math.round((approved30 / closed30.length) * 100);

  const employeesOnly = employees.filter((e: Profile) => e.role === "employee");
  const totalQuota = employeesOnly.reduce(
    (sum: number, e: Profile) => sum + (e.annual_vacation_days ?? 0),
    0,
  );
  const taken = approved
    .filter((r: LeaveRequest) => r.leave_type === "vacation" && monthKey(r.created_at) === thisMonth)
    .length;
  const utilizationPct = totalQuota === 0 ? 0 : Math.min(100, Math.round((taken / totalQuota) * 100));

  return {
    activeEmployees: employeesOnly.length,
    approvedLastMonth,
    approvedThisMonth,
    approvalRate30d,
    approvedCount: approved.length,
    pendingCount: pending.length,
    rejectedCount: rejected.length,
    totalCount: requests.length,
    totalEmployees: employees.length,
    utilizationPct,
  };
}

/** Tendencia mensual de los últimos `monthsBack` meses (incluye el actual). */
export async function getMonthlyTrend(monthsBack = 12): Promise<MonthlyTrend> {
  const requests = await listHrLeaveRequests();
  const now = startOfMonth(new Date());
  const buckets: MonthlyTrend = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      approved: 0,
      month: d.toISOString().slice(0, 7),
      pending: 0,
      rejected: 0,
    });
  }
  for (const r of requests) {
    const key = monthKey(r.created_at);
    const bucket = buckets.find((b) => b.month === key);
    if (!bucket) continue;
    if (r.status === "approved" || r.status === "approved_by_manager") bucket.approved += 1;
    else if (r.status === "rejected" || r.status === "rejected_by_manager") bucket.rejected += 1;
    else if (r.status === "pending_hr" || r.status === "pending_manager") bucket.pending += 1;
  }
  return buckets;
}

export async function getLeaveTypeDistribution(): Promise<TypeDistribution> {
  const requests = await listHrLeaveRequests();
  const counts: Record<LeaveType, number> = { other: 0, personal: 0, sick: 0, vacation: 0 };
  for (const r of requests) {
    counts[r.leave_type] = (counts[r.leave_type] ?? 0) + 1;
  }
  return (Object.keys(counts) as LeaveType[]).map((type) => ({ count: counts[type], type }));
}

export type StagnantRequest = {
  daysOld: number;
  employee_name: string;
  id: string;
  leave_type: LeaveType;
  start_date: string;
  status: string;
};

/** Solicitudes pendientes/old con más de X horas sin resolver. */
export async function getStagnantRequests(thresholdHours = 72): Promise<StagnantRequest[]> {
  const requests = await listHrLeaveRequests();
  const cutoff = Date.now() - thresholdHours * 3_600_000;
  return requests
    .filter(
      (r) =>
        (r.status === "pending_hr" || r.status === "approved_by_manager" || r.status === "pending_manager") &&
        new Date(r.created_at).getTime() < cutoff,
    )
    .map((r) => ({
      daysOld: Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86_400_000),
      employee_name: r.employee?.full_name ?? "Empleado",
      id: r.id,
      leave_type: r.leave_type,
      start_date: r.start_date,
      status: r.status,
    }))
    .sort((a, b) => b.daysOld - a.daysOld)
    .slice(0, 8);
}

export type RecentOnboarding = {
  created_at: string;
  full_name: string;
  id: string;
  job_title: string | null;
  role: string;
};

/** Empleados nuevos (creados en los últimos `daysBack` días). */
export async function getRecentOnboardings(daysBack = 30): Promise<RecentOnboarding[]> {
  const employees = await listEmployees();
  const cutoff = new Date(Date.now() - daysBack * 86_400_000).toISOString();
  return employees
    .filter((e) => e.created_at >= cutoff)
    .map((e) => ({
      created_at: e.created_at,
      full_name: e.full_name,
      id: e.id,
      job_title: e.job_title,
      role: e.role,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);
}

export type InactiveEmployee = {
  daysSince: number;
  full_name: string;
  id: string;
  job_title: string | null;
};

/** Empleados sin ninguna solicitud creada en los últimos `daysBack` días. */
export async function getInactiveEmployees(daysBack = 180): Promise<InactiveEmployee[]> {
  const [employees, requests] = await Promise.all([listEmployees(), listHrLeaveRequests()]);
  const cutoff = new Date(Date.now() - daysBack * 86_400_000).toISOString();
  const recent = new Set(requests.filter((r) => r.created_at >= cutoff).map((r) => r.employee_id));
  return employees
    .filter((e) => e.role === "employee" && !recent.has(e.id))
    .map((e) => ({
      daysSince: Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86_400_000),
      full_name: e.full_name,
      id: e.id,
      job_title: e.job_title,
    }))
    .slice(0, 6);
}
