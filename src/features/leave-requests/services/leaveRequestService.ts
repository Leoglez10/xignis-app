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
import { getCurrentProfile } from "../../profiles/services/profileService";

export { leaveTypeLabel } from "../config";

export type LeaveRequestDraft = {
  endDate: string;
  endTime?: string;
  leaveType: LeaveType;
  pendingTasks?: string;
  scheduleType: ScheduleType;
  startDate: string;
  startTime?: string;
};

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee?: Pick<Profile, "full_name" | "job_title"> | null;
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

export async function listMyLeaveRequests() {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", userId)
    .order("created_at", { ascending: false });

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
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as LeaveRequestWithEmployee;
}

export async function createLeaveRequest(draft: LeaveRequestDraft) {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: userId,
      end_date: draft.endDate,
      end_time: draft.scheduleType === "time_range" ? draft.endTime : null,
      leave_type: draft.leaveType,
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

export async function listManagerLeaveRequests() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .eq("status", "pending_manager")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LeaveRequestWithEmployee[];
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
  return (data ?? []) as LeaveRequestWithEmployee[];
}

export async function listHrLeaveRequests() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)")
    .in("status", ["pending_hr", "approved_by_manager", "approved", "rejected"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaveRequestWithEmployee[];
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
