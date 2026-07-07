-- ============ notifications table ============
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info',
  related_request_id uuid references public.leave_requests(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- no client INSERT policy: only SECURITY DEFINER triggers write notifications

-- ============ HR/admin can update profiles (assign role / manager) ============
drop policy if exists profiles_hr_update on public.profiles;
create policy profiles_hr_update on public.profiles
  for update using (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]));

-- ============ route new request: no manager -> straight to HR ============
create or replace function public.route_leave_request()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare mgr uuid;
begin
  select manager_id into mgr from public.profiles where id = new.employee_id;
  if mgr is null and new.status = 'pending_manager' then
    new.status := 'pending_hr';
  end if;
  return new;
end $$;

drop trigger if exists trg_route_leave_request on public.leave_requests;
create trigger trg_route_leave_request before insert on public.leave_requests
  for each row execute function public.route_leave_request();

-- ============ notify on new request ============
create or replace function public.notify_new_leave_request()
returns trigger language plpgsql security definer set search_path to 'public' as $$
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
end $$;

drop trigger if exists trg_notify_new_leave_request on public.leave_requests;
create trigger trg_notify_new_leave_request after insert on public.leave_requests
  for each row execute function public.notify_new_leave_request();

-- ============ notify on status change ============
create or replace function public.notify_leave_status_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
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
  elsif new.status in ('rejected','rejected_by_manager') then
    insert into public.notifications(user_id,title,body,type,related_request_id)
      values (emp,'Solicitud rechazada', coalesce(new.rejection_reason,'Sin motivo capturado'), 'request_rejected', new.id);
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_leave_status_change on public.leave_requests;
create trigger trg_notify_leave_status_change after update of status on public.leave_requests
  for each row execute function public.notify_leave_status_change();

-- ============ realtime ============
alter publication supabase_realtime add table public.notifications;
