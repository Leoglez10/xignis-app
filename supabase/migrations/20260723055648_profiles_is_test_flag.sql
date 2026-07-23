-- Test accounts: usable by the developer (they can still log in and operate),
-- but hidden from real HR/admin/managers in every listing. Enforced at RLS so
-- there is a single choke point instead of filtering each query app-side.

alter table public.profiles
  add column if not exists is_test boolean not null default false;

-- Mark the seed accounts (@xignis.test) as test data.
update public.profiles p
set is_test = true
from auth.users u
where u.id = p.id
  and u.email ilike '%@xignis.test';

-- Rewrite the SELECT policy: keep the original visibility, then hide test rows
-- from everyone except the row owner (so a test account still sees itself).
drop policy if exists profiles_select_own_team_or_hr on public.profiles;
create policy profiles_select_own_team_or_hr on public.profiles
  as permissive for select to authenticated
  using (
    (
      id = (select auth.uid())
      or manager_id = (select auth.uid())
      or private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role])
    )
    and (is_test = false or id = (select auth.uid()))
  );

-- Only privileged roles may flip is_test; a non-admin cannot un-hide itself.
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  if not (private.current_user_role() = any (array['admin'::public.user_role, 'hr_admin'::public.user_role])) then
    new.role := old.role;
    new.manager_id := old.manager_id;
    new.job_title := old.job_title;
    new.annual_vacation_days := old.annual_vacation_days;
    new.is_test := old.is_test;
  end if;
  return new;
end $function$;
