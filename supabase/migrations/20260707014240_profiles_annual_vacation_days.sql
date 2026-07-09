alter table public.profiles
add column if not exists annual_vacation_days integer;

alter table public.profiles
drop constraint if exists profiles_annual_vacation_days_range;

alter table public.profiles
add constraint profiles_annual_vacation_days_range
check (annual_vacation_days is null or (annual_vacation_days >= 0 and annual_vacation_days <= 365));

create or replace function public.guard_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path to 'public, private' as $$
begin
  -- Only privileged roles (admin / hr_admin) may change role, manager, job_title or vacation allowance.
  if not (private.current_user_role() = any (array['admin'::user_role,'hr_admin'::user_role])) then
    new.role := old.role;
    new.manager_id := old.manager_id;
    new.job_title := old.job_title;
    new.annual_vacation_days := old.annual_vacation_days;
  end if;
  return new;
end $$;

revoke execute on function public.guard_profile_privileged_fields() from anon, authenticated;
