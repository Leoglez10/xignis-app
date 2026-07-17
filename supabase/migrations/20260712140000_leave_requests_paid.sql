-- P1-5: permisos con/sin goce de sueldo. `paid` ortogonal a leave_type.
alter table public.leave_requests
  add column if not exists paid boolean not null default true;
