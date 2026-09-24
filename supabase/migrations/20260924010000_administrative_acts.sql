-- ============================================================================
-- Xignis HR — Administrative acts (tarjeta amarilla)
-- ----------------------------------------------------------------------------
-- RH/admin can create administrative acts per employee. Employees see their own
-- acts in their profile; managers see their direct reports' acts read-only.
-- Owners do NOT get access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.administrative_acts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  act_type text not null check (act_type in ('amonestacion_verbal','amonestacion_escrita','suspension','otro')),
  reason text not null,
  act_date date not null,
  notes text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index administrative_acts_employee_id_idx on public.administrative_acts (employee_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.administrative_acts enable row level security;

create policy administrative_acts_select_visible on public.administrative_acts
  for select to authenticated
  using (
    employee_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where id = employee_id
        and manager_id = (select auth.uid())
    )
    or private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role])
  );

create policy administrative_acts_write_hr on public.administrative_acts
  for all to authenticated
  using (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]))
  with check (private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]));

-- ---------------------------------------------------------------------------
-- Notification trigger for new acts
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_administrative_act()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.notifications(user_id, title, body, type)
  values (
    new.employee_id,
    'Nueva acta administrativa',
    'Recibiste una acta: ' || case new.act_type
      when 'amonestacion_verbal' then 'Amonestación verbal'
      when 'amonestacion_escrita' then 'Amonestación escrita'
      when 'suspension' then 'Suspensión'
      else 'Otro'
    end,
    'info'
  );
  return new;
end;
$function$;

create trigger trg_notify_new_administrative_act
  after insert on public.administrative_acts
  for each row execute function public.notify_new_administrative_act();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.administrative_acts to authenticated;
revoke all on public.administrative_acts from anon;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.administrative_acts;
