export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "hr_admin" | "manager" | "employee";
export const USER_ROLES: readonly UserRole[] = ["employee", "manager", "hr_admin", "admin"];
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

export type EmploymentStatus = "active" | "on_leave" | "terminated" | "archived";
export type SeparationType = "voluntary" | "involuntary" | "end_contract" | "relocation" | "retirement" | "other";

export type Profile = {
  annual_vacation_days: number | null;
  avatar_url: string | null;
  birth_date: string | null;
  created_at: string;
  custom_fields: Record<string, Json>;
  department_id: string | null;
  employment_status: EmploymentStatus;
  full_name: string;
  hire_date: string | null;
  id: string;
  job_title: string | null;
  manager_id: string | null;
  role: UserRole;
  separation_type: SeparationType | null;
  terminated_at: string | null;
  termination_reason: string | null;
  updated_at: string;
};

export type Department = {
  id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmploymentEvent = {
  id: string;
  user_id: string;
  event_type: string;
  effective_date: string;
  reason: string | null;
  metadata: Json | null;
  created_by: string | null;
  created_at: string;
};

export type LeaveRequest = {
  coverage_contact: string | null;
  created_at: string;
  employee_id: string;
  end_date: string;
  end_time: string | null;
  id: string;
  leave_type: LeaveType;
  paid: boolean;
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

export type AppSetting = {
  key: string;
  value: boolean | number | string;
  updated_at: string;
  updated_by: string | null;
};

export type FieldVisibility = "all" | "manager" | "private" | "rh_confidential";
export type FieldEditable = "self_and_rh" | "rh_only" | "self";
export type CustomFieldType = "text" | "number" | "date" | "select" | "boolean";

export type ProfileFieldDef = {
  id: string;
  key: string;
  label: string;
  field_type: CustomFieldType;
  options: Json | null;
  section: string;
  sort_order: number;
  visibility: FieldVisibility;
  editable_by: FieldEditable;
  required: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Devuelto por el RPC get_profile_sheet: campos fijos + custom filtrado por visibilidad. */
export type ProfileSheet = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  role: UserRole;
  manager_id: string | null;
  manager_name: string | null;
  department_id: string | null;
  department_name: string | null;
  birth_date: string | null;
  hire_date: string | null;
  annual_vacation_days: number | null;
  employment_status: EmploymentStatus;
  custom: Record<string, Json>;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          annual_vacation_days?: number | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          custom_fields?: Json;
          department_id?: string | null;
          employment_status?: EmploymentStatus;
          full_name: string;
          hire_date?: string | null;
          id: string;
          job_title?: string | null;
          manager_id?: string | null;
          role?: UserRole;
          separation_type?: SeparationType | null;
          terminated_at?: string | null;
          termination_reason?: string | null;
        };
        Update: Partial<Omit<Profile, "created_at" | "updated_at">>;
        Relationships: [];
      };
      leave_requests: {
        Row: LeaveRequest;
        Insert: {
          coverage_contact?: string | null;
          employee_id: string;
          end_date: string;
          end_time?: string | null;
          leave_type: LeaveType;
          paid?: boolean;
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
      app_settings: {
        Row: AppSetting;
        Insert: {
          key: string;
          value: boolean | number | string;
          updated_by?: string | null;
        };
        Update: Partial<Pick<AppSetting, "value" | "updated_by">>;
        Relationships: [];
      };
      departments: {
        Row: Department;
        Insert: {
          name: string;
          description?: string | null;
          archived_at?: string | null;
        };
        Update: Partial<Pick<Department, "name" | "description" | "archived_at">>;
        Relationships: [];
      };
      employment_events: {
        Row: EmploymentEvent;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profile_field_defs: {
        Row: ProfileFieldDef;
        Insert: {
          key: string;
          label: string;
          field_type?: CustomFieldType;
          options?: Json | null;
          section?: string;
          sort_order?: number;
          visibility?: FieldVisibility;
          editable_by?: FieldEditable;
          required?: boolean;
          archived_at?: string | null;
        };
        Update: Partial<Omit<ProfileFieldDef, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_profile_sheet: { Args: { target: string }; Returns: Json };
      set_profile_custom_field: { Args: { target: string; field_key: string; new_value: Json }; Returns: undefined };
    };
    Enums: {
      approval_decision: ApprovalDecision;
      custom_field_type: CustomFieldType;
      field_editable: FieldEditable;
      field_visibility: FieldVisibility;
      leave_status: LeaveStatus;
      leave_type: LeaveType;
      schedule_type: ScheduleType;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
