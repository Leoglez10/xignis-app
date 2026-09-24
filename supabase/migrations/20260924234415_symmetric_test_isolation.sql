-- ============================================================================
-- Xignis HR — Symmetric test-account isolation
-- ----------------------------------------------------------------------------
-- Supersedes the rationale of 20260728123000_test_accounts_see_each_other.
--
-- Before: test rows (profiles.is_test) were hidden from real users, but the
-- seeded @xignis.test accounts still saw REAL data through their role
-- (e.g. a test hr_admin listed every real employee, a test owner saw every
-- real leave request). Those accounts have well-known credentials, so that was
-- a PII exposure path.
--
-- Rule now: a viewer may see (or touch) a row about employee X only if X is
-- the viewer, or X.is_test = viewer.is_test — ON TOP of the existing
-- role / manager / owner rules. Test accounts live in the test partition, real
-- accounts in the real one; the test flow (test employee -> test manager ->
-- test HR -> test owner) keeps working inside its own partition.
--
-- How it is enforced:
--   1. private.same_test_partition(uuid) helper.
--   2. private.can_access_employee and profiles_select_own_team_or_hr now use
--      the symmetric guard (owner branch from 20260924130000 preserved).
--   3. One RESTRICTIVE policy per employee-keyed table (AND-ed with every
--      permissive policy, for every command). This also covers the owner
--      branches (`or private.is_owner()`) that bypassed can_access_employee,
--      and write paths (HR updates/inserts) without rewriting each policy.
--   4. SECURITY DEFINER RPCs bypass RLS, so each one gets the same check.
--   5. Notification triggers fan out to HR/admin only within the partition of
--      the employee the notification is about (they embed names/subjects).
--   6. Cleanup of already-delivered cross-partition request notifications.
--
-- Manual verification (run as postgres in a local stack; ids are examples):
--   -- test hr_admin cannot see a real profile
--   set local role authenticated;
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<maria.hr@xignis.test uuid>', 'role', 'authenticated')::text, true);
--   select count(*) from public.profiles where is_test = false;          -- expect 0
--   select public.get_profile_sheet('<real employee uuid>');              -- expect null
--   select public.get_time_bank_for('<real employee uuid>');              -- expect null
--   -- real hr_admin cannot see a test profile
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<real hr uuid>', 'role', 'authenticated')::text, true);
--   select count(*) from public.profiles where is_test = true;           -- expect 0
--   -- test manager still sees its test report + its requests
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<test manager uuid>', 'role', 'authenticated')::text, true);
--   select count(*) from public.profiles where manager_id = '<test manager uuid>'; -- expect > 0
--   select count(*) from public.leave_requests;                          -- only test rows
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper
-- ---------------------------------------------------------------------------
create or replace function private.same_test_partition(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select target.is_test
      from public.profiles target
      where target.id = target_employee_id
    ) = private.current_user_is_test(),
    false
  )
$function$;

revoke execute on function private.same_test_partition(uuid) from public, anon;
grant execute on function private.same_test_partition(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2a. Choke point for leave_requests / leave_request_approvals.
-- ---------------------------------------------------------------------------
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
      private.same_test_partition(target_employee_id)
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

-- ---------------------------------------------------------------------------
-- 2b. profiles listing: same branches as 20260924130000, symmetric guard.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own_team_or_hr on public.profiles;
create policy profiles_select_own_team_or_hr on public.profiles
  as permissive for select to authenticated
  using (
    (
      id = (select auth.uid())
      or manager_id = (select auth.uid())
      or private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role])
      or private.is_owner()
    )
    and (
      id = (select auth.uid())
      or is_test = (select private.current_user_is_test())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Restrictive partition policies (apply to SELECT/INSERT/UPDATE/DELETE).
--    The employee's own rows always pass (target = viewer => same is_test).
-- ---------------------------------------------------------------------------
drop policy if exists profiles_same_test_partition on public.profiles;
create policy profiles_same_test_partition on public.profiles
  as restrictive for all to authenticated
  using (id = (select auth.uid()) or is_test = (select private.current_user_is_test()))
  with check (id = (select auth.uid()) or is_test = (select private.current_user_is_test()));

drop policy if exists leave_requests_same_test_partition on public.leave_requests;
create policy leave_requests_same_test_partition on public.leave_requests
  as restrictive for all to authenticated
  using (private.same_test_partition(employee_id))
  with check (private.same_test_partition(employee_id));

drop policy if exists approvals_same_test_partition on public.leave_request_approvals;
create policy approvals_same_test_partition on public.leave_request_approvals
  as restrictive for all to authenticated
  using (
    exists (
      select 1 from public.leave_requests lr
      where lr.id = leave_request_approvals.leave_request_id
        and private.same_test_partition(lr.employee_id)
    )
  )
  with check (
    exists (
      select 1 from public.leave_requests lr
      where lr.id = leave_request_approvals.leave_request_id
        and private.same_test_partition(lr.employee_id)
    )
  );

drop policy if exists time_bank_same_test_partition on public.time_bank_transactions;
create policy time_bank_same_test_partition on public.time_bank_transactions
  as restrictive for all to authenticated
  using (private.same_test_partition(employee_id))
  with check (private.same_test_partition(employee_id));

drop policy if exists employment_events_same_test_partition on public.employment_events;
create policy employment_events_same_test_partition on public.employment_events
  as restrictive for all to authenticated
  using (private.same_test_partition(user_id))
  with check (private.same_test_partition(user_id));

drop policy if exists administrative_acts_same_test_partition on public.administrative_acts;
create policy administrative_acts_same_test_partition on public.administrative_acts
  as restrictive for all to authenticated
  using (private.same_test_partition(employee_id))
  with check (private.same_test_partition(employee_id));

drop policy if exists hr_reports_same_test_partition on public.hr_reports;
create policy hr_reports_same_test_partition on public.hr_reports
  as restrictive for all to authenticated
  using (private.same_test_partition(reporter_id))
  with check (private.same_test_partition(reporter_id));

drop policy if exists owner_requests_same_test_partition on public.owner_requests;
create policy owner_requests_same_test_partition on public.owner_requests
  as restrictive for all to authenticated
  using (private.same_test_partition(owner_id))
  with check (private.same_test_partition(owner_id));

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER RPCs (bypass RLS) — same bodies + partition check.
-- ---------------------------------------------------------------------------
-- get_profile_sheet: latest body from 20260923190123 (owner as viewer).
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

  if not (is_self or private.same_test_partition(p.id)) then
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

revoke execute on function public.get_profile_sheet(uuid) from public, anon;
grant execute on function public.get_profile_sheet(uuid) to authenticated;

-- set_profile_custom_field: latest body from baseline.
create or replace function public.set_profile_custom_field(target uuid, field_key text, new_value jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
  is_self boolean := caller = target;
  def public.profile_field_defs%rowtype;
begin
  if caller is null then
    raise exception 'No autenticado.';
  end if;

  if not (is_self or private.same_test_partition(target)) then
    raise exception 'Sin permiso para editar el campo %.', field_key;
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

revoke execute on function public.set_profile_custom_field(uuid, text, jsonb) from public, anon;
grant execute on function public.set_profile_custom_field(uuid, text, jsonb) to authenticated;

-- get_time_bank_for: latest body from 20260728130000.
create or replace function public.get_time_bank_for(p_employee_id uuid)
returns numeric
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
  is_manager boolean;
begin
  if caller is null then
    return null;
  end if;

  select (manager_id = caller) into is_manager
  from public.profiles
  where id = p_employee_id;

  if not (caller = p_employee_id or is_manager or is_hr) then
    return null;
  end if;

  if not (caller = p_employee_id or private.same_test_partition(p_employee_id)) then
    return null;
  end if;

  return public.time_bank_balance(p_employee_id);
end;
$$;

revoke execute on function public.get_time_bank_for(uuid) from public, anon;
grant execute on function public.get_time_bank_for(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Notification triggers: HR/admin fan-out stays inside the partition of
--    the employee the notification is about (bodies embed names/subjects).
-- ---------------------------------------------------------------------------
-- notify_new_leave_request: latest body from baseline.
create or replace function public.notify_new_leave_request()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare emp_name text; emp_is_test boolean; mgr uuid; hr_id uuid;
begin
  select full_name, manager_id, is_test into emp_name, mgr, emp_is_test
    from public.profiles where id = new.employee_id;
  if new.status = 'pending_manager' and mgr is not null then
    insert into public.notifications(user_id,title,body,type,related_request_id)
      select mgr,'Nueva solicitud', coalesce(emp_name,'Un empleado') || ' envió una solicitud de permiso.', 'request_new', new.id
      where exists (select 1 from public.profiles m where m.id = mgr and m.is_test = emp_is_test);
  elsif new.status = 'pending_hr' then
    for hr_id in
      select id from public.profiles
      where role = any (array['hr_admin'::user_role,'admin'::user_role])
        and is_test = emp_is_test
    loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Nueva solicitud para RH', coalesce(emp_name,'Un empleado') || ' envió una solicitud.', 'request_new', new.id);
    end loop;
  end if;
  return new;
end $function$;

-- notify_leave_status_change: latest body from baseline.
create or replace function public.notify_leave_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare emp uuid; emp_name text; emp_is_test boolean; hr_id uuid;
begin
  if new.status = old.status then return new; end if;
  emp := new.employee_id;
  select full_name, is_test into emp_name, emp_is_test from public.profiles where id = emp;

  if new.status = 'approved_by_manager' then
    for hr_id in
      select id from public.profiles
      where role = any (array['hr_admin'::user_role,'admin'::user_role])
        and is_test = emp_is_test
    loop
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
        and is_test = emp_is_test
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
        and is_test = emp_is_test
        and id is distinct from new.reviewed_by
    loop
      insert into public.notifications(user_id,title,body,type,related_request_id)
        values (hr_id,'Solicitud rechazada', 'Se rechazó el permiso de ' || coalesce(emp_name,'un empleado') || '.', 'request_update', new.id);
    end loop;
  end if;
  return new;
end $function$;

-- notify_new_owner_request: latest body from 20260923190123.
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
      and is_test = (select o.is_test from public.profiles o where o.id = new.owner_id)
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

-- notify_new_hr_report: latest body from 20260924120000.
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
      and is_test = (select r.is_test from public.profiles r where r.id = new.reporter_id)
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

-- Trigger functions are never client-callable.
revoke all on function public.notify_new_leave_request() from public, anon, authenticated;
revoke all on function public.notify_leave_status_change() from public, anon, authenticated;
revoke all on function public.notify_new_owner_request() from public, anon, authenticated;
revoke all on function public.notify_new_hr_report() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Cleanup: drop request notifications already delivered across partitions
--    (they embed the other partition's employee names). Notifications without
--    related_request_id (owner requests / HR reports) cannot be attributed.
-- ---------------------------------------------------------------------------
delete from public.notifications n
using public.leave_requests lr, public.profiles emp, public.profiles recipient
where n.related_request_id = lr.id
  and emp.id = lr.employee_id
  and recipient.id = n.user_id
  and emp.is_test is distinct from recipient.is_test;
