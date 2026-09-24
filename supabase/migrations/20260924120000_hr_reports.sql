-- ============================================================================
-- Xignis HR — Employee-to-RH reports
-- ----------------------------------------------------------------------------
-- Allows any employee to report an issue to HR. HR/admin can view and resolve.
-- The anonymity flag only instructs HR not to reveal the author to third
-- parties; the reporter_id is always stored and visible to HR.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.hr_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  request_anonymity boolean not null default false,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_by uuid null references public.profiles(id) on delete set null,
  resolved_at timestamptz null
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index hr_reports_reporter_id_idx on public.hr_reports (reporter_id);
create index hr_reports_status_idx on public.hr_reports (status);
create index hr_reports_created_at_idx on public.hr_reports (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.hr_reports enable row level security;

create policy hr_reports_select_own_or_hr on public.hr_reports
  for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
  );

create policy hr_reports_insert_own on public.hr_reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy hr_reports_update_hr on public.hr_reports
  for update to authenticated
  using (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]));

-- ---------------------------------------------------------------------------
-- Notify HR/admin when an employee creates a report
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_hr_report()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare hr_id uuid;
begin
  for hr_id in
    select id from public.profiles
    where role = any (array['hr_admin'::user_role, 'admin'::user_role])
  loop
    insert into public.notifications(user_id, title, body, type)
    values (
      hr_id,
      'Nuevo reporte de un empleado',
      'Te llegó un reporte: ' || new.subject,
      'info'
    );
  end loop;
  return new;
end;
$function$;

create trigger trg_notify_new_hr_report
  after insert on public.hr_reports
  for each row execute function public.notify_new_hr_report();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update on public.hr_reports to authenticated;
revoke all on public.hr_reports from anon;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.hr_reports;
