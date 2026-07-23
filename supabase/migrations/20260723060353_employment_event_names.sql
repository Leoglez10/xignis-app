-- Employment events stored raw UUIDs for department/manager changes, so the
-- profile timeline rendered ids instead of readable names. Resolve names at
-- write time and backfill existing rows.

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
        jsonb_build_object(
          'from', old.department_id,
          'to', new.department_id,
          'from_name', (select name from public.departments where id = old.department_id),
          'to_name', (select name from public.departments where id = new.department_id)),
        (select auth.uid()));
  end if;
  if new.manager_id is distinct from old.manager_id then
    insert into public.employment_events(user_id, event_type, metadata, created_by)
      values (new.id, 'manager_change',
        jsonb_build_object(
          'from', old.manager_id,
          'to', new.manager_id,
          'from_name', (select full_name from public.profiles where id = old.manager_id),
          'to_name', (select full_name from public.profiles where id = new.manager_id)),
        (select auth.uid()));
  end if;
  return new;
end $function$;

update public.employment_events e
set metadata = e.metadata
  || jsonb_strip_nulls(jsonb_build_object(
       'from_name', (select d.name from public.departments d where d.id::text = e.metadata ->> 'from'),
       'to_name', (select d.name from public.departments d where d.id::text = e.metadata ->> 'to')))
where e.event_type = 'department_change'
  and not (e.metadata ? 'to_name');

update public.employment_events e
set metadata = e.metadata
  || jsonb_strip_nulls(jsonb_build_object(
       'from_name', (select p.full_name from public.profiles p where p.id::text = e.metadata ->> 'from'),
       'to_name', (select p.full_name from public.profiles p where p.id::text = e.metadata ->> 'to')))
where e.event_type = 'manager_change'
  and not (e.metadata ? 'to_name');
