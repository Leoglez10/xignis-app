export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "hr_admin" | "manager" | "employee";
export type LeaveType = "vacation" | "sick" | "personal" | "other";
export type LeaveStatus =
  | "pending_manager"
  | "approved_by_manager"
  | "rejected_by_manager"
  | "pending_hr"
  | "approved"
  | "rejected"
  | "cancelled";
export type ScheduleType = "full_day" | "time_range";
export type ApprovalDecision = "approved" | "rejected";

export type Profile = {
  avatar_url: string | null;
  created_at: string;
  full_name: string;
  id: string;
  job_title: string | null;
  manager_id: string | null;
  role: UserRole;
  updated_at: string;
};

export type LeaveRequest = {
  created_at: string;
  employee_id: string;
  end_date: string;
  end_time: string | null;
  id: string;
  leave_type: LeaveType;
  pending_tasks: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  schedule_type: ScheduleType;
  start_date: string;
  start_time: string | null;
  status: LeaveStatus;
  updated_at: string;
};

export type LeaveRequestApproval = {
  comment: string | null;
  created_at: string;
  decision: ApprovalDecision;
  id: string;
  leave_request_id: string;
  reviewer_id: string;
  reviewer_role: UserRole;
};

export type NotificationType =
  | "info"
  | "request_new"
  | "request_hr"
  | "request_update"
  | "request_approved"
  | "request_rejected";

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  related_request_id: string | null;
  read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          avatar_url?: string | null;
          full_name: string;
          id: string;
          job_title?: string | null;
          manager_id?: string | null;
          role?: UserRole;
        };
        Update: Partial<Omit<Profile, "created_at" | "updated_at">>;
        Relationships: [];
      };
      leave_requests: {
        Row: LeaveRequest;
        Insert: {
          employee_id: string;
          end_date: string;
          end_time?: string | null;
          leave_type: LeaveType;
          pending_tasks?: string | null;
          schedule_type?: ScheduleType;
          start_date: string;
          start_time?: string | null;
          status?: LeaveStatus;
        };
        Update: Partial<Omit<LeaveRequest, "created_at" | "updated_at">>;
        Relationships: [];
      };
      leave_request_approvals: {
        Row: LeaveRequestApproval;
        Insert: {
          comment?: string | null;
          decision: ApprovalDecision;
          leave_request_id: string;
          reviewer_id: string;
          reviewer_role: UserRole;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: {
          user_id: string;
          title: string;
          body?: string | null;
          type?: NotificationType;
          related_request_id?: string | null;
          read?: boolean;
        };
        Update: Partial<Pick<AppNotification, "read">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      approval_decision: ApprovalDecision;
      leave_status: LeaveStatus;
      leave_type: LeaveType;
      schedule_type: ScheduleType;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
