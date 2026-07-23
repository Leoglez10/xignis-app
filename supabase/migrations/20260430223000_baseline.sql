-- ============================================================================
-- Xignis HR — Squashed baseline (regenerated 2026-07-21 from remote schema)
-- ----------------------------------------------------------------------------
-- This single migration replaces the previous fragmented history, which had
-- drifted from the remote DB and carried two dead product layers (a legacy
-- "Xignis GE" inventory app and a Spanish HR prototype). It reproduces ONLY the
-- live HR application schema as it exists on the remote project.
--
-- Deliberately EXCLUDED (dead code present on remote but unused by the app):
--   * inventory tables/functions (organizations, items, org_members, ...)
--   * Spanish prototype tables (empleados, solicitudes_*, tokens_aprobacion,
--     login_intentos) and their enums (RolEmpleado, TipoPermiso, ...)
--   * legacy auth trigger handle_new_user (superseded by xignis_handle_new_user)
--   * private.get_user_org_ids / private.get_admin_org_ids / create_organization
--     / process_pending_invitations (reference dropped tables)
-- ============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'hr_admin', 'manager', 'employee');
create type public.leave_type as enum ('vacation', 'sick', 'personal', 'other');
create type public.leave_status as enum ('pending_manager', 'approved_by_manager', 'rejected_by_manager', 'pending_hr', 'approved', 'rejected', 'cancelled');
create type public.schedule_type as enum ('full_day', 'time_range');
create type public.approval_decision as enum ('approved', 'rejected');
create type public.custom_field_type as enum ('text', 'number', 'date', 'select', 'boolean');
create type public.field_visibility as enum ('all', 'manager', 'private', 'rh_confidential');
create type public.field_editable as enum ('self_and_rh', 'rh_only', 'self');

-- ---------------------------------------------------------------------------
-- Tables (columns + primary keys + check constraints)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key,
  role public.user_role not null default 'employee'::public.user_role,
  full_name text not null,
  job_title text,
  manager_id uuid,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  annual_vacation_days integer,
  department_id uuid,
  employment_status text not null default 'active'::text,
  terminated_at timestamptz,
  termination_reason text,
  separation_type text,
  custom_fields jsonb not null default '{}'::jsonb,
  birth_date date,
  hire_date date,
  constraint profiles_annual_vacation_days_range check ((annual_vacation_days is null) or ((annual_vacation_days >= 0) and (annual_vacation_days <= 365))),
  constraint profiles_employment_status_check check (employment_status = any (array['active'::text, 'on_leave'::text, 'terminated'::text, 'archived'::text])),
  constraint profiles_separation_type_check check ((separation_type is null) or (separation_type = any (array['voluntary'::text, 'involuntary'::text, 'end_contract'::text, 'relocation'::text, 'retirement'::text, 'other'::text])))
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name_key unique (name)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  start_date date not null,
  end_date date not null,
  leave_type public.leave_type not null,
  schedule_type public.schedule_type not null default 'full_day'::public.schedule_type,
  start_time time,
  end_time time,
  pending_tasks text,
  status public.leave_status not null default 'pending_manager'::public.leave_status,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid boolean not null default true,
  coverage_contact text,
  constraint leave_dates_valid check (end_date >= start_date),
  constraint leave_time_valid check ((schedule_type = 'full_day'::public.schedule_type) or ((start_time is not null) and (end_time is not null) and (end_time > start_time)))
);

create table public.leave_request_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null,
  reviewer_id uuid not null,
  reviewer_role public.user_role not null,
  decision public.approval_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  type text not null default 'info'::text,
  related_request_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.employment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  effective_date timestamptz not null default now(),
  reason text,
  metadata jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table public.profile_field_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  field_type public.custom_field_type not null default 'text'::public.custom_field_type,
  options jsonb,
  section text not null default 'General'::text,
  sort_order integer not null default 0,
  visibility public.field_visibility not null default 'all'::public.field_visibility,
  editable_by public.field_editable not null default 'rh_only'::public.field_editable,
  required boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_field_defs_key_key unique (key)
);

-- ---------------------------------------------------------------------------
-- Foreign keys (added after all tables exist)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
  add constraint profiles_manager_id_fkey foreign key (manager_id) references public.profiles(id),
  add constraint profiles_department_id_fkey foreign key (department_id) references public.departments(id) on delete set null;

alter table public.leave_requests
  add constraint leave_requests_employee_id_fkey foreign key (employee_id) references public.profiles(id) on delete cascade,
  add constraint leave_requests_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id);

alter table public.leave_request_approvals
  add constraint leave_request_approvals_leave_request_id_fkey foreign key (leave_request_id) references public.leave_requests(id) on delete cascade,
  add constraint leave_request_approvals_reviewer_id_fkey foreign key (reviewer_id) references public.profiles(id);

alter table public.notifications
  add constraint notifications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint notifications_related_request_id_fkey foreign key (related_request_id) references public.leave_requests(id) on delete cascade;

alter table public.employment_events
  add constraint employment_events_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint employment_events_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.app_settings
  add constraint app_settings_updated_by_fkey foreign key (updated_by) references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index profiles_manager_id_idx on public.profiles (manager_id);
create index profiles_department_id_idx on public.profiles (department_id);
create index profiles_employment_status_idx on public.profiles (employment_status);
create index profiles_birth_date_idx on public.profiles (birth_date);
create index profiles_hire_date_idx on public.profiles (hire_date);
create index leave_requests_employee_id_idx on public.leave_requests (employee_id);
create index leave_requests_reviewed_by_idx on public.leave_requests (reviewed_by);
create index leave_requests_dates_idx on public.leave_requests (start_date, end_date);
create index leave_requests_status_created_at_idx on public.leave_requests (status, created_at desc);
create index leave_request_approvals_leave_request_id_idx on public.leave_request_approvals (leave_request_id);
create index leave_request_approvals_reviewer_id_idx on public.leave_request_approvals (reviewer_id);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_related_request_id_idx on public.notifications (related_request_id);
create index employment_events_user_idx on public.employment_events (user_id, created_at desc);
create index employment_events_created_by_idx on public.employment_events (created_by);
create index app_settings_updated_by_idx on public.app_settings (updated_by);

-- ---------------------------------------------------------------------------
-- Functions — private schema (role helpers, SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = (select auth.uid())
$function$;

CREATE OR REPLACE FUNCTION private.can_access_employee(target_employee_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select auth.uid()) = target_employee_id
    or exists (
      select 1
      from public.profiles employee
      where employee.id = target_employee_id
        and employee.manager_id = (select auth.uid())
    )
    or private.current_user_role() in ('hr_admin', 'admin'),
    false
  )
$function$;

CREATE OR REPLACE FUNCTION private.can_hr_review()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(private.current_user_role() in ('hr_admin', 'admin'), false)
$function$;

CREATE OR REPLACE FUNCTION private.can_manager_review(target_employee_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    private.current_user_role() in ('manager', 'admin')
    and exists (
      select 1
      from public.profiles employee
      where employee.id = target_employee_id
        and employee.manager_id = (select auth.uid())
    ),
    false
  )
$function$;

-- ---------------------------------------------------------------------------
-- Functions — public schema
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.xignis_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.xignis_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, role, full_name, job_title)
  values (
    new.id,
    'employee',
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'job_title', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, private'
AS $function$
begin
  -- Only privileged roles (admin / hr_admin) may change role, manager, job_title or vacation allowance.
  if not (private.current_user_role() = any (array['admin'::user_role,'hr_admin'::user_role])) then
    new.role := old.role;
    new.manager_id := old.manager_id;
    new.job_title := old.job_title;
    new.annual_vacation_days := old.annual_vacation_days;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.log_employment_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.route_leave_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare mgr uuid; require_mgr boolean;
begin
  select manager_id into mgr from public.profiles where id = new.employee_id;
  select coalesce((value)::boolean, true) into require_mgr
    from public.app_settings where key = 'requireManagerApproval';
  if new.status = 'pending_manager' and (mgr is null or require_mgr is false) then
    new.status := 'pending_hr';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.xignis_prepare_leave_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.employee_id = auth.uid();
    end if;

    new.reviewed_by = null;
    new.reviewed_at = null;
    new.rejection_reason = null;

    if exists (
      select 1
      from public.profiles p
      where p.id = new.employee_id
        and p.manager_id is not null
    ) then
      new.status = 'pending_manager';
    else
      new.status = 'pending_hr';
    end if;
  end if;

  if new.schedule_type = 'full_day' then
    new.start_time = null;
    new.end_time = null;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_leave_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare emp_name text; mgr uuid; hr_id uuid;
begin
  select full_name, manager_id into emp_name, mgr from public.profiles where id = new.employee_id;
  if new.status = 'pending_manager' and mgr is not null then
    insert into public.notifications(user_id,title,body,type,related_request_id)
      values (mgr,'Nueva solicitud', coalesce(emp_name,'Un empleado') || ' envió una solicitud de permiso.', 'request_new', new.id);
  elsif new.status = 'pending_hr' then
    for hr_id in select id from public.profiles where role = any (array['hr_admin'::user_role,'admin'::user_role]) loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Nueva solicitud para RH', coalesce(emp_name,'Un empleado') || ' envió una solicitud.', 'request_new', new.id);
    end loop;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare emp uuid; emp_name text; hr_id uuid;
begin
  if new.status = old.status then return new; end if;
  emp := new.employee_id;
  select full_name into emp_name from public.profiles where id = emp;

  if new.status = 'approved_by_manager' then
    for hr_id in select id from public.profiles where role = any (array['hr_admin'::user_role,'admin'::user_role]) loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Aprobada por jefe', coalesce(emp_name,'Un empleado') || ' espera validación de RH.', 'request_hr', new.id);
    end loop;
    insert into public.notifications(user_id,title,body,type,related_request_id)
      values (emp,'Tu jefe aprobó','Tu solicitud pasó a revisión de RH.','request_update', new.id);
  elsif new.status = 'approved' then
    insert into public.notifications(user_id,title,body,type,related_request_id)
      values (emp,'Solicitud aprobada','RH aprobó tu permiso. 🎉','request_approved', new.id);
    for hr_id in
      select id from public.profiles
      where role = any (array['hr_admin'::user_role,'admin'::user_role])
        and id is distinct from new.reviewed_by
    loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Solicitud aprobada', 'Se aprobó el permiso de ' || coalesce(emp_name,'un empleado') || '.', 'request_update', new.id);
    end loop;
  elsif new.status in ('rejected','rejected_by_manager') then
    insert into public.notifications(user_id,title,body,type,related_request_id)
      values (emp,'Solicitud rechazada', coalesce(new.rejection_reason,'Sin motivo capturado'), 'request_rejected', new.id);
    for hr_id in
      select id from public.profiles
      where role = any (array['hr_admin'::user_role,'admin'::user_role])
        and id is distinct from new.reviewed_by
    loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Solicitud rechazada', 'Se rechazó el permiso de ' || coalesce(emp_name,'un empleado') || '.', 'request_update', new.id);
    end loop;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.get_profile_sheet(target uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
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

  if not (is_self or is_manager or is_hr) then
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
       or (d.visibility = 'manager' and (is_self or is_manager or is_hr))
       or (d.visibility = 'private' and (is_self or is_hr))
       or (d.visibility = 'rh_confidential' and is_hr)
     );

  return jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'job_title', p.job_title,
    'role', p.role,
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

CREATE OR REPLACE FUNCTION public.set_profile_custom_field(target uuid, field_key text, new_value jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
  is_self boolean := caller = target;
  def public.profile_field_defs%rowtype;
begin
  if caller is null then
    raise exception 'No autenticado.';
  end if;

  select * into def from public.profile_field_defs where key = field_key and archived_at is null;
  if not found then
    raise exception 'Campo % no existe o está archivado.', field_key;
  end if;

  if not (
    (def.editable_by = 'rh_only' and is_hr)
    or (def.editable_by = 'self_and_rh' and (is_self or is_hr))
    or (def.editable_by = 'self' and is_self)
  ) then
    raise exception 'Sin permiso para editar el campo %.', field_key;
  end if;

  update public.profiles
     set custom_fields = jsonb_set(custom_fields, array[field_key], new_value, true)
   where id = target;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.xignis_set_updated_at();
create trigger trg_guard_profile_privileged_fields before update on public.profiles for each row execute function public.guard_profile_privileged_fields();
create trigger trg_log_employment_event after update on public.profiles for each row execute function public.log_employment_event();

create trigger leave_requests_prepare_insert before insert on public.leave_requests for each row execute function public.xignis_prepare_leave_request();
create trigger leave_requests_set_updated_at before update on public.leave_requests for each row execute function public.xignis_set_updated_at();
create trigger trg_route_leave_request before insert on public.leave_requests for each row execute function public.route_leave_request();
create trigger trg_notify_new_leave_request after insert on public.leave_requests for each row execute function public.notify_new_leave_request();
create trigger trg_notify_leave_status_change after update of status on public.leave_requests for each row execute function public.notify_leave_status_change();

-- Auth: create the HR profile row on signup (replaces legacy handle_new_user).
create trigger on_auth_user_created_xignis_profile after insert on auth.users for each row execute function public.xignis_handle_new_user();

-- Defense-in-depth: auto-enable RLS on any new public table.
create event trigger rls_auto_enable_trg on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_request_approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.employment_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.profile_field_defs enable row level security;

-- profiles
CREATE POLICY profiles_select_own_team_or_hr ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR (manager_id = ( SELECT auth.uid() AS uid)) OR (private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]))));
CREATE POLICY profiles_insert_own_employee ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((id = ( SELECT auth.uid() AS uid)) AND (role = 'employee'::user_role)));
CREATE POLICY profiles_update_own_or_privileged ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR (private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])))) WITH CHECK (((id = ( SELECT auth.uid() AS uid)) OR (private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]))));

-- departments
CREATE POLICY departments_select_authenticated ON public.departments AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY departments_insert_hr ON public.departments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));
CREATE POLICY departments_update_hr ON public.departments AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]))) WITH CHECK ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));
CREATE POLICY departments_delete_hr ON public.departments AS PERMISSIVE FOR DELETE TO authenticated USING ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));

-- leave_requests
CREATE POLICY leave_select_own_team_or_hr ON public.leave_requests AS PERMISSIVE FOR SELECT TO authenticated USING (private.can_access_employee(employee_id));
CREATE POLICY leave_insert_own ON public.leave_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((employee_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending_manager'::leave_status, 'pending_hr'::leave_status])) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)));
CREATE POLICY leave_update_by_actor ON public.leave_requests AS PERMISSIVE FOR UPDATE TO authenticated USING ((((employee_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending_manager'::leave_status, 'pending_hr'::leave_status, 'approved_by_manager'::leave_status]))) OR (private.can_manager_review(employee_id) AND (status = 'pending_manager'::leave_status)) OR (private.can_hr_review() AND (status = ANY (ARRAY['pending_hr'::leave_status, 'approved_by_manager'::leave_status]))))) WITH CHECK ((((employee_id = ( SELECT auth.uid() AS uid)) AND (status = 'cancelled'::leave_status)) OR (private.can_manager_review(employee_id) AND (status = ANY (ARRAY['approved_by_manager'::leave_status, 'rejected_by_manager'::leave_status])) AND (reviewed_by = ( SELECT auth.uid() AS uid)) AND (reviewed_at IS NOT NULL)) OR (private.can_hr_review() AND (status = ANY (ARRAY['approved'::leave_status, 'rejected'::leave_status])) AND (reviewed_by = ( SELECT auth.uid() AS uid)) AND (reviewed_at IS NOT NULL))));

-- leave_request_approvals
CREATE POLICY approvals_select_visible_requests ON public.leave_request_approvals AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM leave_requests lr WHERE ((lr.id = leave_request_approvals.leave_request_id) AND private.can_access_employee(lr.employee_id)))));
CREATE POLICY approvals_insert_reviewer ON public.leave_request_approvals AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((reviewer_id = ( SELECT auth.uid() AS uid)) AND (reviewer_role = private.current_user_role()) AND (EXISTS ( SELECT 1 FROM leave_requests lr WHERE ((lr.id = leave_request_approvals.leave_request_id) AND (private.can_manager_review(lr.employee_id) OR private.can_hr_review()))))));

-- notifications
CREATE POLICY notifications_select_own ON public.notifications AS PERMISSIVE FOR SELECT TO public USING ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY notifications_update_own ON public.notifications AS PERMISSIVE FOR UPDATE TO public USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY notifications_delete_own ON public.notifications AS PERMISSIVE FOR DELETE TO public USING ((user_id = ( SELECT auth.uid() AS uid)));

-- employment_events
CREATE POLICY employment_events_select_hr ON public.employment_events AS PERMISSIVE FOR SELECT TO authenticated USING (((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])) OR (user_id = ( SELECT auth.uid() AS uid))));

-- app_settings
CREATE POLICY app_settings_select_authenticated ON public.app_settings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY app_settings_insert_hr ON public.app_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));
CREATE POLICY app_settings_update_hr ON public.app_settings AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]))) WITH CHECK ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));
CREATE POLICY app_settings_delete_hr ON public.app_settings AS PERMISSIVE FOR DELETE TO authenticated USING ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));

-- profile_field_defs
CREATE POLICY profile_field_defs_select_authenticated ON public.profile_field_defs AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.role() AS role) = 'authenticated'::text));
CREATE POLICY profile_field_defs_write_hr ON public.profile_field_defs AS PERMISSIVE FOR ALL TO public USING ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]))) WITH CHECK ((private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role])));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated, anon, service_role;
grant select, insert, update, delete on public.departments to authenticated, anon, service_role;
grant select, insert, update, delete on public.leave_requests to authenticated, anon, service_role;
grant select, insert, update, delete on public.leave_request_approvals to authenticated, anon, service_role;
grant select, insert, update, delete on public.notifications to authenticated, anon, service_role;
grant select on public.employment_events to authenticated;
grant select, insert, update, delete on public.employment_events to service_role;
grant select, insert, update, delete on public.app_settings to authenticated, service_role;
grant select, insert, update, delete on public.profile_field_defs to authenticated, anon, service_role;

-- SECURITY DEFINER RPCs: locked to authenticated only (no anon/public).
revoke execute on function public.get_profile_sheet(uuid) from public, anon;
grant execute on function public.get_profile_sheet(uuid) to authenticated;
revoke execute on function public.set_profile_custom_field(uuid, text, jsonb) from public, anon;
grant execute on function public.set_profile_custom_field(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime — tables published on supabase_realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.leave_request_approvals;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.departments;
alter publication supabase_realtime add table public.app_settings;
alter publication supabase_realtime add table public.profile_field_defs;

-- ---------------------------------------------------------------------------
-- Storage — avatars bucket (public read via bucket flag; writes are owner-scoped)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('xignis-profiles', 'xignis-profiles', true)
on conflict (id) do nothing;

create policy "Profiles: Users can upload their own avatar"
  on storage.objects as permissive for insert to authenticated
  with check ((bucket_id = 'xignis-profiles'::text) and ((auth.uid())::text = (storage.foldername(name))[0]));

create policy "Profiles: Users can update their own avatar"
  on storage.objects as permissive for update to authenticated
  using ((bucket_id = 'xignis-profiles'::text) and ((auth.uid())::text = (storage.foldername(name))[0]));
