insert into public.profiles (id, role, full_name, job_title, manager_id)
select
  users.id,
  data.role::user_role,
  data.full_name,
  data.job_title,
  null
from (
  values
    ('carlos.manager@xignis.test', 'manager', 'Carlos Manager', 'Jefe de operaciones'),
    ('maria.hr@xignis.test', 'hr_admin', 'Maria HR', 'Recursos Humanos'),
    ('admin.tech@xignis.test', 'admin', 'Admin Tecnico', 'Administracion'),
    ('ana.employee@xignis.test', 'employee', 'Ana Employee', 'Analista')
) as data(email, role, full_name, job_title)
join auth.users users on users.email = data.email
on conflict (id) do update
set
  role = excluded.role,
  full_name = excluded.full_name,
  job_title = excluded.job_title;

-- The UPDATE target cannot be referenced from a join condition inside `from`,
-- which is what the previous `join auth.users employee_user on ... = employee.id`
-- was doing; Postgres rejects it with "invalid reference to FROM-clause entry".
-- Matching the target in the WHERE clause is the equivalent that parses.
update public.profiles employee
set manager_id = manager.id
from public.profiles manager
join auth.users manager_user on manager_user.id = manager.id
where manager_user.email = 'carlos.manager@xignis.test'
  and employee.id = (select id from auth.users where email = 'ana.employee@xignis.test');
