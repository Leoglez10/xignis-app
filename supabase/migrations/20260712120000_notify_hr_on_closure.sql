-- P0-1: al cerrar una solicitud (approved/rejected) notificar también a RRHH,
-- no solo al empleado. Se excluye al revisor que ejecutó la acción (no auto-notificarse).
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
end $$;

revoke execute on function public.notify_leave_status_change() from anon, authenticated;
