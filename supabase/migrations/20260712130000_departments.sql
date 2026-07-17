-- P1-1: áreas/departamentos gestionados por RRHH.
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments enable row level security;

drop policy if exists departments_select_authenticated on public.departments;
create policy departments_select_authenticated on public.departments
  for select using ((select auth.role()) = 'authenticated');

drop policy if exists departments_write_hr on public.departments;
create policy departments_write_hr on public.departments
  for all
  using (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role,'admin'::user_role]));

-- Relación en profiles (nullable; job_title sigue siendo el puesto).
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists profiles_department_id_idx on public.profiles (department_id);

alter publication supabase_realtime add table public.departments;
