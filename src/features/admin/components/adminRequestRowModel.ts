import type { LeaveRequestWithEmployee } from "../../leave-requests/services/leaveRequestService";
import {
  buildApprovalSteps,
  statusLabel,
  type StepState,
} from "../../leave-requests/services/leaveRequestProgressService";

export type AdminRequestRowModel = {
  /** 1-based index of the step shown as current (active, rejected or last reached). */
  currentStep: number;
  isActionable: boolean;
  statusText: string;
  steps: StepState[];
};

/**
 * Derives the compact stepper and status text for an HR list row from the
 * request status alone (no approvals are fetched per row).
 */
export function buildAdminRequestRowModel(request: LeaveRequestWithEmployee): AdminRequestRowModel {
  const hasManager = Boolean(request.employee?.manager_id);
  const full = buildApprovalSteps(request, [], hasManager);

  // Without approval records, a manager step that was already passed (e.g. an
  // approved request) comes back "pending". The flow is sequential, so any
  // pending step before a done/rejected one must have been completed.
  const lastReached = full.reduce((acc, s, i) => (s.state === "done" || s.state === "rejected" ? i : acc), -1);
  const steps = full.map((s, i) => (s.state === "pending" && i < lastReached ? "done" : s.state));

  const activeIndex = steps.findIndex((s) => s === "active" || s === "rejected");
  const currentIndex = activeIndex >= 0 ? activeIndex : Math.max(lastReached, 0);
  const active = full.find((s) => s.state === "active");

  return {
    currentStep: currentIndex + 1,
    isActionable: request.status === "pending_hr" || request.status === "approved_by_manager",
    statusText: active?.subtitle ?? statusLabel[request.status],
    steps,
  };
}
