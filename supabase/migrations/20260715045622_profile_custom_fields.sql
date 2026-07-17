-- Ficha de perfil con campos custom gestionados por RRHH.
-- Dos ejes ortogonales por campo:
--   visibility  (quién LEE):  all | manager | private | rh_confidential
--   editable_by (quién ESCRIBE): self_and_rh | rh_only | self
-- Los valores viven en profiles.custom_fields (jsonb, key -> value).
-- RLS en Postgres es por FILA, no por key de jsonb: por eso la lectura filtrada
-- va por una función security definer que borra las keys que el caller no puede ver.

-- 1. Enums (guard idempotente: create type no soporta IF NOT EXISTS).
do $$ begin
  create type public.field_visibility as enum ('all', 'manager', 'private', 'rh_confidential');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.field_editable as enum ('self_and_rh', 'rh_only', 'self');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.custom_field_type as enum ('text', 'number', 'date', 'select', 'boolean');
exception when duplicate_object then null; end $$;

-- 2. Definiciones de campo (las administra RRHH: agregar/quitar/reordenar).
create table if not exists public.profile_field_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                              -- clave máquina, ej: 'salary'
  label text not null,                                   -- rótulo visible
  field_type public.custom_field_type not null default 'text',
  options jsonb,                                          -- para 'select': ["A","B"]
  section text not null default 'General',
  sort_order int not null default 0,
  visibility public.field_visibility not null default 'all',
  editable_by public.field_editable not null default 'rh_only',
  required boolean not null default false,
  archived_at timestamptz,                               -- soft-delete: conserva valores viejos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_field_defs enable row level security;

drop policy if exists profile_field_defs_select_authenticated on public.profile_field_defs;
create policy profile_field_defs_select_authenticated on public.profile_field_defs
  for select using ((select auth.role()) = 'authenticated');

drop policy if exists profile_field_defs_write_hr on public.profile_field_defs;
create policy profile_field_defs_write_hr on public.profile_field_defs
  for all
  using (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]));

-- 3. Valores por persona.
alter table public.profiles
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- 4. Lectura filtrada por visibilidad (security definer).
--    Devuelve los campos fijos + un jsonb 'custom' que SOLO trae las keys que el
--    caller puede ver según su relación con el target. Si el caller no puede ver
--    la ficha (no es RRHH, ni el dueño, ni su jefe directo), devuelve null.
create or replace function public.get_profile_sheet(target uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
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

  -- Barrera de fila: mismos que la RLS de profiles (dueño / jefe directo / RRHH).
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
    'manager_id', p.manager_id,
    'department_id', p.department_id,
    'birth_date', p.birth_date,
    'hire_date', p.hire_date,
    'annual_vacation_days', p.annual_vacation_days,
    'employment_status', p.employment_status,
    'custom', visible_custom
  );
end;
$$;

-- 5. Escritura de un campo custom con validación de editable_by (security definer).
create or replace function public.set_profile_custom_field(target uuid, field_key text, new_value jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
  is_self boolean := caller = target;
  def public.profile_field_defs%rowtype;
begin
  if caller is null then
    raise exception 'No autenticado.';
  end if;

  select * into def from public.profile_field_defs where key = field_key and archived_at is null;
  if not found then
    raise exception 'Campo % no existe o está archivado.', field_key;
  end if;

  if not (
    (def.editable_by = 'rh_only' and is_hr)
    or (def.editable_by = 'self_and_rh' and (is_self or is_hr))
    or (def.editable_by = 'self' and is_self)
  ) then
    raise exception 'Sin permiso para editar el campo %.', field_key;
  end if;

  update public.profiles
     set custom_fields = jsonb_set(custom_fields, array[field_key], new_value, true)
   where id = target;
end;
$$;

grant execute on function public.get_profile_sheet(uuid) to authenticated;
grant execute on function public.set_profile_custom_field(uuid, text, jsonb) to authenticated;

-- 6. Campo de arranque: sueldo (privado: dueño + RRHH; solo RRHH edita).
insert into public.profile_field_defs (key, label, field_type, section, sort_order, visibility, editable_by)
values ('salary', 'Sueldo', 'number', 'Compensación', 10, 'private', 'rh_only')
on conflict (key) do nothing;

-- 7. Realtime para que el editor de campos de RRHH refleje cambios en vivo.
alter publication supabase_realtime add table public.profile_field_defs;
