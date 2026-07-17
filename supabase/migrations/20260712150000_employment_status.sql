-- P3-1: soft-delete con razón de separación.
alter table public.profiles
  add column if not exists employment_status text not null default 'active'
    check (employment_status in ('active','on_leave','terminated','archived')),
  add column if not exists terminated_at timestamptz,
  add column if not exists termination_reason text,
  add column if not exists separation_type text
    check (separation_type is null or separation_type in
      ('voluntary','involuntary','end_contract','relocation','retirement','other'));

create index if not exists profiles_employment_status_idx on public.profiles (employment_status);

-- P3-5: historial laboral (alta, cambios de área/manager, baja).
create table if not exists public.employment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  effective_date timestamptz not null default now(),
  reason text,
  metadata jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.employment_events enable row level security;
create index if not exists employment_events_user_idx on public.employment_events (user_id, created_at desc);

drop policy if exists employment_events_select_hr on public.employment_events;
create policy employment_events_select_hr on public.employment_events
  for select using (
    private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role])
    or user_id = (select auth.uid())
  );
-- Sin INSERT de cliente: solo trigger SECURITY DEFINER escribe.

create or replace function public.log_employment_event()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.employment_status is distinct from old.employment_status then
    insert into public.employment_events(user_id, event_type, reason, metadata, created_by)
      values (new.id, 'status_change', new.termination_reason,
        jsonb_build_object('from', old.employment_status, 'to', new.employment_status, 'separation_type', new.separation_type),
        (select auth.uid()));
  end if;
  if new.department_id is distinct from old.department_id then
    insert into public.employment_events(user_id, event_type, metadata, created_by)
      values (new.id, 'department_change',
        jsonb_build_object('from', old.department_id, 'to', new.department_id),
        (select auth.uid()));
  end if;
  if new.manager_id is distinct from old.manager_id then
    insert into public.employment_events(user_id, event_type, metadata, created_by)
      values (new.id, 'manager_change',
        jsonb_build_object('from', old.manager_id, 'to', new.manager_id),
        (select auth.uid()));
  end if;
  return new;
end $$;

revoke execute on function public.log_employment_event() from public, anon, authenticated;

drop trigger if exists trg_log_employment_event on public.profiles;
create trigger trg_log_employment_event after update on public.profiles
  for each row execute function public.log_employment_event();
