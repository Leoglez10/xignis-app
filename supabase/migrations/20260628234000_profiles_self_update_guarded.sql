-- Allow users to edit their OWN profile (name, avatar), but never escalate
-- role / reassign manager / change their own job_title.
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.guard_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path to 'public, private' as $$
begin
  -- Only privileged roles (admin / hr_admin) may change role, manager or job_title.
  if not (private.current_user_role() = any (array['admin'::user_role,'hr_admin'::user_role])) then
    new.role := old.role;
    new.manager_id := old.manager_id;
    new.job_title := old.job_title;
  end if;
  return new;
end $$;

revoke execute on function public.guard_profile_privileged_fields() from anon, authenticated;

drop trigger if exists trg_guard_profile_privileged_fields on public.profiles;
create trigger trg_guard_profile_privileged_fields before update on public.profiles
  for each row execute function public.guard_profile_privileged_fields();
