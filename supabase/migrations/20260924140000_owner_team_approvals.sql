-- ============================================================================
-- Xignis HR — Owner team approvals
-- ----------------------------------------------------------------------------
-- "Jefe" is a relation (profiles.manager_id = me), not a role. An owner can be
-- the manager_id of employees; their requests enter pending_manager (see
-- xignis_prepare_leave_request) but can_manager_review only accepted the
-- manager/admin roles, so those requests got stuck.
--
-- This lets the owner review ONLY its direct reports, exactly like a manager.
-- The authority stays scoped by employee.manager_id = auth.uid(); the owner
-- gains no write access to anyone else and the rest of the owner panel stays
-- read-only.
--
-- Dependents that pick this up without further changes:
--   * leave_update_by_actor (leave_requests UPDATE) → pending_manager →
--     approved_by_manager / rejected_by_manager with reviewed_by = auth.uid().
--   * approvals_insert_reviewer (leave_request_approvals INSERT) → requires
--     reviewer_role = current_user_role(), so the owner records 'owner'
--     (the client already sends profile.role).
-- Already relation-based (no change needed): notify_new_leave_request
-- (notifies manager_id), can_access_employee, profiles_select_own_team_or_hr,
-- get_time_bank_for, time_bank_select_team, get_profile_sheet.
-- ============================================================================

create or replace function private.can_manager_review(target_employee_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(
    private.current_user_role() in ('manager', 'admin', 'owner')
    and exists (
      select 1
      from public.profiles employee
      where employee.id = target_employee_id
        and employee.manager_id = (select auth.uid())
    ),
    false
  )
$function$;
