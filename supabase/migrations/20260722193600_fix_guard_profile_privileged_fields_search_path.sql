-- The baseline definition quoted the search_path as a single identifier
-- ("public, private"), which resolved to a non-existent schema. That made the
-- unqualified user_role cast unresolvable and every UPDATE on public.profiles
-- failed with: type "user_role" does not exist.
-- Fix: set a proper two-element search_path AND schema-qualify the enum type so
-- the function no longer depends on search_path resolution at all.
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $function$
begin
  -- Only privileged roles (admin / hr_admin) may change role, manager, job_title or vacation allowance.
  if not (private.current_user_role() = any (array['admin'::public.user_role, 'hr_admin'::public.user_role])) then
    new.role := old.role;
    new.manager_id := old.manager_id;
    new.job_title := old.job_title;
    new.annual_vacation_days := old.annual_vacation_days;
  end if;
  return new;
end $function$;
