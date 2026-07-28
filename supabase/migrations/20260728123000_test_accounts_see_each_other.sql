-- Test accounts exist so the full approval flow can be exercised end to end:
-- a test employee requests, a test manager approves, a test HR validates. The
-- previous guard hid test rows from every viewer but the owner, which broke
-- that flow. Flip the rule: test rows are hidden from NON-test viewers only.
--
-- Real users therefore never see test data, while the seeded @xignis.test
-- accounts still see each other (and, as before, real data according to their
-- role -- they carry hr_admin/admin roles on purpose).

create or replace function private.current_user_is_test()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select viewer.is_test from public.profiles viewer where viewer.id = (select auth.uid())),
    false
  )
$function$;

grant execute on function private.current_user_is_test() to authenticated;

-- Choke point for leave_requests and leave_request_approvals.
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
      (
        not (
          select employee.is_test
          from public.profiles employee
          where employee.id = target_employee_id
        )
        or private.current_user_is_test()
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

-- Same rule for the profiles listing, so a test HR account can open the test
-- employee it is meant to review.
drop policy if exists profiles_select_own_team_or_hr on public.profiles;
create policy profiles_select_own_team_or_hr on public.profiles
  as permissive for select to authenticated
  using (
    (
      id = (select auth.uid())
      or manager_id = (select auth.uid())
      or private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role])
    )
    and (
      is_test = false
      or id = (select auth.uid())
      or private.current_user_is_test()
    )
  );
