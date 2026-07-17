-- Harden the P1 tables already deployed remotely.
-- RLS remains the authorization boundary; table grants only expose the
-- operations each API role can legitimately attempt.

revoke all on table public.departments from anon;
revoke all on table public.app_settings from anon;
revoke all on table public.employment_events from anon;

revoke all on table public.departments from authenticated;
grant select, insert, update, delete on table public.departments to authenticated;

revoke all on table public.app_settings from authenticated;
grant select, insert, update, delete on table public.app_settings to authenticated;

revoke all on table public.employment_events from authenticated;
grant select on table public.employment_events to authenticated;

drop policy if exists departments_select_authenticated on public.departments;
drop policy if exists departments_write_hr on public.departments;

create policy departments_select_authenticated on public.departments
  for select to authenticated
  using (true);

create policy departments_insert_hr on public.departments
  for insert to authenticated
  with check (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

create policy departments_update_hr on public.departments
  for update to authenticated
  using (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

create policy departments_delete_hr on public.departments
  for delete to authenticated
  using (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

drop policy if exists app_settings_select_authenticated on public.app_settings;
drop policy if exists app_settings_write_hr on public.app_settings;

create policy app_settings_select_authenticated on public.app_settings
  for select to authenticated
  using (true);

create policy app_settings_insert_hr on public.app_settings
  for insert to authenticated
  with check (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

create policy app_settings_update_hr on public.app_settings
  for update to authenticated
  using (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

create policy app_settings_delete_hr on public.app_settings
  for delete to authenticated
  using (private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role]));

drop policy if exists employment_events_select_hr on public.employment_events;

create policy employment_events_select_hr on public.employment_events
  for select to authenticated
  using (
    private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role])
    or user_id = (select auth.uid())
  );

create index if not exists app_settings_updated_by_idx
  on public.app_settings (updated_by);

create index if not exists employment_events_created_by_idx
  on public.employment_events (created_by);
