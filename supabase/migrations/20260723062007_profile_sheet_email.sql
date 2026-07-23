-- Expose the account email in the profile sheet.
-- The email lives in auth.users, so only this SECURITY DEFINER function can read it.
-- Visibility is already gated above: only self, direct manager or HR/admin get a sheet.

create or replace function public.get_profile_sheet(target uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
