import { Plane, Stethoscope, User, Utensils, type LucideIcon } from "lucide-react";
import type { LeaveStatus, LeaveType } from "../../lib/database.types";

type LeaveTypeEntry = {
  avatarTone: string;
  chipTone: string;
  label: string;
  icon: LucideIcon;
};

export const leaveTypeConfig: Record<LeaveType, LeaveTypeEntry> = {
  vacation: {
    avatarTone: "bg-emerald-100 text-emerald-700",
    chipTone: "bg-emerald-100 text-emerald-800",
    label: "Vacaciones",
    icon: Plane,
  },
  personal: {
    avatarTone: "bg-indigo-100 text-indigo-700",
    chipTone: "bg-indigo-100 text-indigo-800",
    label: "Personal",
    icon: Utensils,
  },
  sick: {
    avatarTone: "bg-rose-100 text-rose-700",
    chipTone: "bg-rose-100 text-rose-800",
    label: "Enfermedad",
    icon: Stethoscope,
  },
  other: {
    avatarTone: "bg-slate-200 text-slate-700",
    chipTone: "bg-slate-200 text-slate-700",
    label: "Otro",
    icon: User,
  },
};

export const leaveTypeLabel = Object.fromEntries(
  (Object.entries(leaveTypeConfig) as [LeaveType, LeaveTypeEntry][]).map(([k, v]) => [k, v.label]),
) as Record<LeaveType, string>;

export const statusTone: Record<LeaveStatus, string> = {
  pending_manager: "bg-orange-100 text-orange-800",
  approved_by_manager: "bg-indigo-100 text-indigo-800",
  rejected_by_manager: "bg-red-100 text-red-800",
  pending_hr: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
};