-- ============================================================================
-- Xignis HR — Route requests of HR-managed employees straight to HR
-- ----------------------------------------------------------------------------
-- HR can pick an hr_admin/admin as an employee's manager, but the HR panel only
-- reviews as HR (pending_hr / approved_by_manager). A request routed to
-- pending_manager with an HR manager could never be acted on from the UI.
-- The manager step is redundant there (the same person reviews as HR), so it
-- is skipped. Owners and managers keep the manager step.
-- ============================================================================

create or replace function public.route_leave_request()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare mgr uuid; mgr_role public.user_role; require_mgr boolean;
begin
  select e.manager_id, m.role into mgr, mgr_role
    from public.profiles e
    left join public.profiles m on m.id = e.manager_id
    where e.id = new.employee_id;
  select coalesce((value)::boolean, true) into require_mgr
    from public.app_settings where key = 'requireManagerApproval';
  if new.status = 'pending_manager'
     and (mgr is null or require_mgr is false or mgr_role in ('hr_admin', 'admin')) then
    new.status := 'pending_hr';
  end if;
  return new;
end $function$;
