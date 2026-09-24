-- ============================================================================
-- Xignis HR — Phase 4: owner read-only suite
-- ----------------------------------------------------------------------------
-- Adds the 'owner' role, extends SELECT visibility for owners, creates the
-- owner_requests channel, and wires a notification trigger for RH.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Role enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'owner'
  ) then
    alter type public.user_role add value 'owner';
    -- Commit inmediato: el valor nuevo de enum no puede usarse en la misma
    -- transacción en la que se agrega (SQLSTATE 55P04). El resto de la
    -- migración corre en la transacción siguiente.
    commit;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------
create or replace function private.is_owner()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(private.current_user_role() = 'owner', false)
$function$;

-- ---------------------------------------------------------------------------
-- Extend SELECT visibility to owners (read-only — never insert/update/delete)
-- ---------------------------------------------------------------------------
alter policy profiles_select_own_team_or_hr on public.profiles
  using (
    id = (select auth.uid())
    or manager_id = (select auth.uid())
    or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
    or private.is_owner()
  );

alter policy leave_select_own_team_or_hr on public.leave_requests
  using (
    private.can_access_employee(employee_id)
    or private.is_owner()
  );

alter policy approvals_select_visible_requests on public.leave_request_approvals
  using (
    exists (
      select 1 from public.leave_requests lr
      where lr.id = leave_request_approvals.leave_request_id
        and (private.can_access_employee(lr.employee_id) or private.is_owner())
    )
  );

alter policy time_bank_select_hr on public.time_bank_transactions
  using (
    private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
    or private.is_owner()
  );

alter policy employment_events_select_hr on public.employment_events
  using (
    private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
    or user_id = (select auth.uid())
    or private.is_owner()
  );

-- ---------------------------------------------------------------------------
-- get_profile_sheet: owners can open any employee sheet as viewers
-- ---------------------------------------------------------------------------
create or replace function public.get_profile_sheet(target uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare
  caller uuid := auth.uid();
  is_privileged boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role, 'owner'::user_role]);
  p public.profiles%rowtype;
  is_self boolean;
  is_manager boolean;
  visible_custom jsonb;
begin
  if caller is null then
    return null;
  end if;

  select * into p from public.profiles where id = target;
  if not found then
    return null;
  end if;

  is_self := caller = p.id;
  is_manager := p.manager_id = caller;

  if not (is_self or is_manager or is_privileged) then
    return null;
  end if;

  select coalesce(
           jsonb_object_agg(d.key, p.custom_fields -> d.key)
             filter (where p.custom_fields ? d.key),
           '{}'::jsonb)
    into visible_custom
    from public.profile_field_defs d
   where d.archived_at is null
     and (
       d.visibility = 'all'
       or (d.visibility = 'manager' and (is_self or is_manager or is_privileged))
       or (d.visibility = 'private' and (is_self or is_privileged))
       or (d.visibility = 'rh_confidential' and is_privileged)
     );

  return jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'job_title', p.job_title,
    'role', p.role,
    'email', (select u.email from auth.users u where u.id = p.id),
    'manager_id', p.manager_id,
    'manager_name', (select full_name from public.profiles where id = p.manager_id),
    'department_id', p.department_id,
    'department_name', (select name from public.departments where id = p.department_id),
    'birth_date', p.birth_date,
    'hire_date', p.hire_date,
    'annual_vacation_days', p.annual_vacation_days,
    'employment_status', p.employment_status,
    'custom', visible_custom
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- Owner requests channel
-- ---------------------------------------------------------------------------
create table public.owner_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  context text null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_by uuid null references public.profiles(id) on delete set null,
  resolved_at timestamptz null
);

create index owner_requests_owner_id_idx on public.owner_requests (owner_id);
create index owner_requests_status_idx on public.owner_requests (status);
create index owner_requests_created_at_idx on public.owner_requests (created_at desc);

alter table public.owner_requests enable row level security;

create policy owner_requests_select_own on public.owner_requests
  for select to authenticated
  using (owner_id = (select auth.uid()) or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]));

create policy owner_requests_insert_own on public.owner_requests
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy owner_requests_update_hr on public.owner_requests
  for update to authenticated
  using (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]));

-- ---------------------------------------------------------------------------
-- Notify RH/admin when an owner creates a request
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_owner_request()
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
      'Nuevo pedido de un dueño',
      'Te llegó un pedido a RH.',
      'info'
    );
  end loop;
  return new;
end;
$function$;

create trigger trg_notify_new_owner_request
  after insert on public.owner_requests
  for each row execute function public.notify_new_owner_request();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update on public.owner_requests to authenticated;
revoke all on public.owner_requests from anon;
grant execute on function public.get_profile_sheet(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.owner_requests;
