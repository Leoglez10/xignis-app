-- The is_test flag was only wired into the profiles SELECT policy, so leave
-- requests created by test accounts still surfaced to HR, admins and managers.
-- Guard it inside can_access_employee instead: it is the single choke point for
-- leave_requests and leave_request_approvals, so one change covers both.
-- The owner branch stays first, so a test account keeps seeing its own rows.

create or replace function private.can_access_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select auth.uid()) = target_employee_id
    or (
      not (
        select employee.is_test
        from public.profiles employee
        where employee.id = target_employee_id
      )
      and (
        exists (
          select 1
          from public.profiles employee
          where employee.id = target_employee_id
            and employee.manager_id = (select auth.uid())
        )
        or private.current_user_role() in ('hr_admin', 'admin')
      )
    ),
    false
  )
$function$;
