-- Legacy Spanish tables are not used by the app, but contain historical rows.
-- Preserve data while blocking Data API access explicitly.
revoke all on table public.empleados from anon, authenticated;
revoke all on table public.login_intentos from anon, authenticated;
revoke all on table public.solicitudes_permiso from anon, authenticated;
revoke all on table public.solicitudes_vacaciones from anon, authenticated;
revoke all on table public.tokens_aprobacion from anon, authenticated;

create policy legacy_no_access_empleados on public.empleados
  for all to public
  using (false)
  with check (false);

create policy legacy_no_access_login_intentos on public.login_intentos
  for all to public
  using (false)
  with check (false);

create policy legacy_no_access_solicitudes_permiso on public.solicitudes_permiso
  for all to public
  using (false)
  with check (false);

create policy legacy_no_access_solicitudes_vacaciones on public.solicitudes_vacaciones
  for all to public
  using (false)
  with check (false);

create policy legacy_no_access_tokens_aprobacion on public.tokens_aprobacion
  for all to public
  using (false)
  with check (false);

create index if not exists empleados_jefe_id_idx
  on public.empleados (jefe_id);

create index if not exists solicitudes_permiso_empleado_id_idx
  on public.solicitudes_permiso (empleado_id);

create index if not exists solicitudes_permiso_respondido_por_idx
  on public.solicitudes_permiso (respondido_por);

create index if not exists solicitudes_vacaciones_empleado_id_idx
  on public.solicitudes_vacaciones (empleado_id);

create index if not exists solicitudes_vacaciones_respondido_por_idx
  on public.solicitudes_vacaciones (respondido_por);

-- Collapse overlapping UPDATE policies into one equivalent authenticated policy.
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_hr_update on public.profiles;
drop policy if exists profiles_self_update on public.profiles;

create policy profiles_update_own_or_privileged on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
  )
  with check (
    id = (select auth.uid())
    or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
  );
