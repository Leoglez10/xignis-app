import type {
  ApprovalDecision,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Profile,
  ScheduleType,
  UserRole,
} from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { diffDaysInclusive } from "../../../lib/date";
import { getCurrentProfile } from "../../profiles/services/profileService";

export { leaveTypeLabel } from "../config";

export type LeaveRequestDraft = {
  coverageContact?: string;
  endDate: string;
  endTime?: string;
  leaveType: LeaveType;
  paid?: boolean;
  pendingTasks?: string;
  scheduleType: ScheduleType;
  startDate: string;
  startTime?: string;
};

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee?: (Pick<Profile, "avatar_url" | "full_name" | "job_title"> & { department_id?: string | null }) | null;
};

export const statusLabel: Record<LeaveStatus, string> = {
  approved: "Aprobada",
  approved_by_manager: "Aprobada por jefe",
  cancelled: "Cancelada",
  pending_hr: "Pendiente RH",
  pending_manager: "Pendiente jefe",
  rejected: "Rechazada",
  rejected_by_manager: "Rechazada por jefe",
};

export function formatDateRange(request: Pick<LeaveRequest, "end_date" | "start_date">) {
  if (request.start_date === request.end_date) return request.start_date;
  return `${request.start_date} - ${request.end_date}`;
}

async function getCurrentUserId() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Necesitas iniciar sesion.");

  return user.id;
}

export type VacationBalance = {
  available: number;
  pending: number;
  quota: number;
  taken: number;
  year: number;
};

/** Saldo de vacaciones del usuario actual:
 *  cuota = profile.annual_vacation_days
 *  tomado = suma de días de vacaciones APROBADAS (full_day) en el año natural actual.
 *  No descuenta pendientes (puede revertirse). */
export async function getMyVacationBalance(): Promise<VacationBalance> {
  const supabase = getSupabaseClient();
  const [profile, requests] = await Promise.all([
    getCurrentProfile(),
    listMyLeaveRequests(),
  ]);
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const taken = (requests ?? [])
    .filter(
      (r) =>
        r.leave_type === "vacation" &&
        r.paid !== false && // sin goce no descuenta saldo de vacaciones
        r.status === "approved" &&
        r.start_date <= yearEnd &&
        r.end_date >= yearStart,
    )
    .reduce((sum, r) => sum + diffDaysInclusive(r.start_date, r.end_date), 0);
  const pending = (requests ?? []).filter((r) => r.leave_type === "vacation" && r.paid !== false && ["pending_manager", "approved_by_manager", "pending_hr"].includes(r.status)).reduce((sum, r) => sum + diffDaysInclusive(r.start_date, r.end_date), 0);
  const quota = profile?.annual_vacation_days ?? 0;
  return { available: Math.max(0, quota - taken), pending, quota, taken, year };
}

type PageOptions = { limit: number; offset?: number };
function page(options: PageOptions) { const offset = options.offset ?? 0; return { from: offset, to: offset + options.limit - 1 }; }

export async function listMyLeaveRequests(options?: PageOptions) {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  let query = supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });
  if (options) query = query.range(page(options).from, page(options).to);
  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function listEmployeeLeaveRequests(employeeId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaveRequest[];
}

export async function getLeaveRequest(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("leave_requests").select("*").eq("id", id).single();

  if (error) throw error;
  return data;
}

export async function getLeaveRequestWithEmployee(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
.select("*, employee:profiles!leave_requests_employee_id_fkey(avatar_url, full_name, job_title)")
      .eq("id", id)
      .single();

  if (error) throw error;
  return data as unknown as LeaveRequestWithEmployee;
}

export async function createLeaveRequest(draft: LeaveRequestDraft) {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      coverage_contact: draft.coverageContact?.trim() || null,
      employee_id: userId,
      end_date: draft.endDate,
      end_time: draft.scheduleType === "time_range" ? draft.endTime : null,
      leave_type: draft.leaveType,
      paid: draft.paid ?? true,
      pending_tasks: draft.pendingTasks || null,
      schedule_type: draft.scheduleType,
      start_date: draft.startDate,
      start_time: draft.scheduleType === "time_range" ? draft.startTime : null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function cancelLeaveRequest(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("leave_requests").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

/** Ausencias aprobadas de IDs específicos que solapen HOY.
 *  Usado por el dashboard empleado para "compañeros ausentes hoy". */
export async function listAbsencesForEmployeesToday(employeeIds: string[]) {
  if (employeeIds.length === 0) return [] as LeaveRequestWithEmployee[];
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("status", "approved")
    .in("employee_id", employeeIds)
    .lte("start_date", today)
    .gte("end_date", today);
  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

export async function listManagerLeaveRequests() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("status", "pending_manager")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

export async function listTeamUpcomingAbsences() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("status", "approved")
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

/** Ausencias aprobadas que solapan un rango [startISO, endISO] inclusive.
 *  RLS scopea al equipo del manager: trae pasado, presente y futuro según el rango. */
export async function listTeamAbsencesInRange(startISO: string, endISO: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("status", "approved")
    .lte("start_date", endISO)
    .gte("end_date", startISO)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

/** Tiempo promedio de aprobación (en horas) del manager actual sobre
 *  solicitudes cerradas en los últimos `daysBack` días. null si no hay datos. */
export async function getManagerApprovalSlaHours(daysBack = 30) {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceIso = since.toISOString();

  const { data, error } = await supabase
    .from("leave_requests")
    .select("created_at, reviewed_at, reviewed_by, status")
    .in("status", ["approved_by_manager", "rejected_by_manager"])
    .eq("reviewed_by", user.id)
    .gte("reviewed_at", sinceIso);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return { avgHours: null, count: 0 };
  const totalMs = rows.reduce((sum, r) => {
    if (!r.reviewed_at) return sum;
    return sum + (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime());
  }, 0);
  const avgHours = totalMs / rows.length / 3_600_000;
  return { avgHours, count: rows.length };
}

export async function listHrLeaveRequests(options?: PageOptions) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title, department_id)")
    .in("status", ["pending_hr", "approved_by_manager", "approved", "rejected"])
    .order("created_at", { ascending: false });
  if (options) query = query.range(page(options).from, page(options).to);
  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as unknown as LeaveRequestWithEmployee[];
}

export async function reviewLeaveRequest(input: {
  comment?: string;
  decision: ApprovalDecision;
  id: string;
  reviewerRole: Extract<UserRole, "admin" | "hr_admin" | "manager">;
}) {
  const supabase = getSupabaseClient();
  const profile = await getCurrentProfile();

  if (!profile) throw new Error("No existe un perfil para esta cuenta.");

  const status: LeaveStatus =
    input.reviewerRole === "manager"
      ? input.decision === "approved"
        ? "approved_by_manager"
        : "rejected_by_manager"
      : input.decision;

  const { error: updateError } = await supabase
    .from("leave_requests")
    .update({
      rejection_reason: input.decision === "rejected" ? input.comment || "Sin motivo capturado" : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
      status,
    })
    .eq("id", input.id);

  if (updateError) throw updateError;

  const { error: approvalError } = await supabase.from("leave_request_approvals").insert({
    comment: input.comment || null,
    decision: input.decision,
    leave_request_id: input.id,
    reviewer_id: profile.id,
    reviewer_role: profile.role,
  });

  if (approvalError) throw approvalError;
}

/** Aplica una decision a varias solicitudes en paralelo. Devuelve el conteo de éxitos
 *  y la lista de errores por id. No aborta el lote si una falla. */
export async function bulkReviewLeaveRequests(input: {
  comment?: string;
  decision: ApprovalDecision;
  ids: string[];
  reviewerRole: Extract<UserRole, "admin" | "hr_admin" | "manager">;
}) {
  const results = await Promise.allSettled(
    input.ids.map((id) =>
      reviewLeaveRequest({ comment: input.comment, decision: input.decision, id, reviewerRole: input.reviewerRole }),
    ),
  );
  const errors: Array<{ id: string; message: string }> = [];
  let ok = 0;
  results.forEach((r, idx) => {
    if (r.status === "fulfilled") {
      ok += 1;
    } else {
      errors.push({ id: input.ids[idx], message: r.reason instanceof Error ? r.reason.message : "Error" });
    }
  });
  return { ok, errors };
}
