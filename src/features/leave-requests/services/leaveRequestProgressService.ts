import type {
  ApprovalDecision,
  LeaveRequest,
  LeaveRequestApproval,
  LeaveStatus,
  UserRole,
} from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";
import { subscribeShared } from "../../../lib/realtimeChannel";
import { statusLabel } from "./leaveRequestService";
import { leaveTypeLabel } from "../config";

export type { LeaveRequestApproval };

/** Estados que aún están "en curso" (no cerrados). */
const IN_FLIGHT: ReadonlySet<LeaveStatus> = new Set([
  "pending_manager",
  "approved_by_manager",
  "pending_hr",
]);

export function isInFlight(status: LeaveStatus): boolean {
  return IN_FLIGHT.has(status);
}

export type StepState = "done" | "active" | "pending" | "rejected" | "skipped";

export type ApprovalStep = {
  /** Etapa corta mostrada en el timeline, p.ej. "Jefe" / "RH". */
  actor: string;
  /** Quién actuó (si ya hay registro de aprobación). */
  approverRole?: UserRole;
  comment?: string | null;
  decision?: ApprovalDecision;
  /** Fecha ISO del cambio (created_at de la aprobación o reviewed_at). */
  occurredAt?: string;
  state: StepState;
  title: string;
  /** Descripción secundaria de la etapa. */
  subtitle: string;
};

/**
 * Reconstruye las etapas del flujo de aprobación a partir del estado actual
 * de la solicitud y los registros de `leave_request_approvals`.
 *
 * Flujo:
 *   Solicitud enviada → (Jefe, si el empleado tiene manager) → RH → Permiso confirmado.
 *   Cuando una etapa se rechaza, la marcamos `rejected` y el resto `skipped`.
 */
export function buildApprovalSteps(
  request: Pick<
    LeaveRequest,
    "status" | "created_at" | "reviewed_at" | "leave_type"
  >,
  approvals: LeaveRequestApproval[],
  /** true si el empleado tiene manager asignado (pasa por jefe). */
  hasManager: boolean,
): ApprovalStep[] {
  const ordered = [...approvals].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const managerApproval = ordered.find((a) => a.reviewer_role === "manager");
  const hrApproval = ordered.find((a) =>
    a.reviewer_role === "hr_admin" || a.reviewer_role === "admin",
  );

  const rejected =
    request.status === "rejected" ||
    request.status === "rejected_by_manager" ||
    request.status === "cancelled";

  const cancelled = request.status === "cancelled";

  const steps: ApprovalStep[] = [
    {
      actor: "Empleado",
      occurredAt: request.created_at,
      state: "done",
      title: "Solicitud enviada",
      subtitle: leaveTypeLabel[request.leave_type],
    },
  ];

  if (hasManager) {
    let state: StepState = "pending";
    let decision: ApprovalDecision | undefined;
    let occurredAt: string | undefined;
    let comment: string | null | undefined;
    let approverRole: UserRole | undefined;

    if (managerApproval) {
      decision = managerApproval.decision;
      occurredAt = managerApproval.created_at;
      comment = managerApproval.comment;
      approverRole = managerApproval.reviewer_role;
      state = decision === "approved" ? "done" : "rejected";
    } else if (request.status === "approved_by_manager") {
      state = "done";
      occurredAt = request.reviewed_at ?? undefined;
    } else if (cancelled) {
      state = "skipped";
    } else if (request.status === "pending_manager") {
      state = "active";
    }

    steps.push({
      actor: "Jefe",
      approverRole,
      comment,
      decision,
      occurredAt,
      state,
      subtitle: decision
        ? decision === "approved"
          ? "Aprobado por tu jefe"
          : "Rechazado por tu jefe"
        : state === "active"
          ? "Esperando aprobación de tu jefe"
          : "Aprobación de tu jefe",
      title: "Aprobación de jefe",
    });
  }

  let hrState: StepState = "pending";
  let hrDecision: ApprovalDecision | undefined;
  let hrOccurredAt: string | undefined;
  let hrComment: string | null | undefined;
  let hrApproverRole: UserRole | undefined;

  if (hrApproval) {
    hrDecision = hrApproval.decision;
    hrOccurredAt = hrApproval.created_at;
    hrComment = hrApproval.comment;
    hrApproverRole = hrApproval.reviewer_role;
    hrState = hrDecision === "approved" ? "done" : "rejected";
  } else if (request.status === "approved") {
    hrState = "done";
    hrOccurredAt = request.reviewed_at ?? undefined;
  } else if (request.status === "rejected") {
    hrState = "rejected";
    hrOccurredAt = request.reviewed_at ?? undefined;
  } else if (
    request.status === "pending_hr" ||
    request.status === "approved_by_manager"
  ) {
    hrState = request.status === "approved_by_manager" ? "active" : "active";
  } else if (cancelled || request.status === "rejected_by_manager") {
    hrState = "skipped";
  }

  if (rejected && hrState === "active") hrState = "skipped";

  steps.push({
    actor: "RH",
    approverRole: hrApproverRole,
    comment: hrComment,
    decision: hrDecision,
    occurredAt: hrOccurredAt,
    state: hrState,
    subtitle: hrDecision
      ? hrDecision === "approved"
        ? "Aprobado por RH"
        : "Rechazado por RH"
      : hrState === "active"
        ? "Esperando validación de RH"
        : "Validación final de RH",
    title: "Aprobación de RH",
  });

  let finalState: StepState = "pending";
  if (request.status === "approved") {
    finalState = "done";
  } else if (request.status === "rejected" || request.status === "rejected_by_manager") {
    finalState = "skipped";
  } else if (cancelled) {
    finalState = "skipped";
  }

  steps.push({
    actor: "Sistema",
    occurredAt: request.status === "approved" ? request.reviewed_at ?? undefined : undefined,
    state: finalState,
    subtitle:
      finalState === "done"
        ? "Permiso confirmado"
        : finalState === "skipped"
          ? "No aplica"
          : "Espera la confirmación final",
    title: "Permiso confirmado",
  });

  return steps;
}

export async function listRequestApprovals(
  requestId: string,
): Promise<LeaveRequestApproval[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("leave_request_approvals")
    .select("*")
    .eq("leave_request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeaveRequestApproval[];
}

/** Devuelve true si el `employee_id` indicado tiene manager asignado. */
export async function employeeHasManager(employeeId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("manager_id")
    .eq("id", employeeId)
    .single();
  if (error) return false;
  return Boolean(data?.manager_id);
}

export type LeaveRequestLive = {
  approvals: LeaveRequestApproval[];
  isLoading: boolean;
  request: LeaveRequest | null;
};

/**
 * Suscripción realtime a una solicitud concreta: refresca request y aprobaciones
 * cuando hay UPDATE en `leave_requests` o INSERT en `leave_request_approvals`.
 * Devuelve función de limpieza.
 */
export function subscribeToLeaveRequest(
  requestId: string,
  onChange: () => void,
): () => void {
  return subscribeShared<void>(
    `leave_request:${requestId}`,
    (channel, fire) =>
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leave_requests", filter: `id=eq.${requestId}` },
          () => fire(),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "leave_request_approvals", filter: `leave_request_id=eq.${requestId}` },
          () => fire(),
        ),
    () => onChange(),
  );
}

type LeaveRequestsScope = {
  /** Si se pasa, filtra por employee_id (empleado viendo las suyas). */
  employeeId?: string;
};

/**
 * Suscripción realtime al alcance del usuario: dispara `onChange` ante cualquier
 * cambio en `leave_requests` visible según RLS. Sin `employeeId` (manager/admin)
 * recibe eventos de todas las filas que RLS permita ver al usuario.
 * Devuelve función de limpieza.
 */
export function subscribeToLeaveRequests(
  scope: LeaveRequestsScope,
  onChange: () => void,
): () => void {
  const filter = scope.employeeId ? `employee_id=eq.${scope.employeeId}` : undefined;
  const topic = scope.employeeId ? `leave_requests:user:${scope.employeeId}` : "leave_requests:scoped";

  return subscribeShared<void>(
    topic,
    (channel, fire) =>
      channel.on(
        "postgres_changes",
        filter
          ? { event: "*", schema: "public", table: "leave_requests", filter }
          : { event: "*", schema: "public", table: "leave_requests" },
        () => fire(),
      ),
    () => onChange(),
  );
}

export { statusLabel };
