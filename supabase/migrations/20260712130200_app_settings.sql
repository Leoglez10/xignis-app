-- P0-4: reglas operativas en backend (antes solo localStorage).
-- Tabla key/value con RLS: lectura autenticados, escritura solo hr_admin/admin.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select_authenticated on public.app_settings;
create policy app_settings_select_authenticated on public.app_settings
  for select using ((select auth.role()) = 'authenticated');

drop policy if exists app_settings_write_hr on public.app_settings;
create policy app_settings_write_hr on public.app_settings
  for all
  using (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]));

-- Defaults iniciales (idempotente).
insert into public.app_settings(key, value) values
  ('requireManagerApproval', 'true'::jsonb),
  ('allowHalfDay', 'true'::jsonb),
  ('notifyByEmail', 'true'::jsonb)
on conflict (key) do nothing;

-- El routing de nuevas solicitudes lee la regla: si requireManagerApproval=false
-- la solicitud entra directo a RH aunque el empleado tenga jefe asignado.
create or replace function public.route_leave_request()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare mgr uuid; require_mgr boolean;
begin
  select manager_id into mgr from public.profiles where id = new.employee_id;
  select coalesce((value)::boolean, true) into require_mgr
    from public.app_settings where key = 'requireManagerApproval';
  if new.status = 'pending_manager' and (mgr is null or require_mgr is false) then
    new.status := 'pending_hr';
  end if;
  return new;
end $$;

revoke execute on function public.route_leave_request() from anon, authenticated;

-- Realtime para que la pantalla de reglas se sincronice entre dispositivos.
alter publication supabase_realtime add table public.app_settings;
