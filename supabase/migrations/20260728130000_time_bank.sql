-- Per-employee hour bank for personal leave (permisos).
-- RH loads hours manually; approved personal leave deducts automatically.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.time_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  hours numeric(6,2) not null,
  reason text not null,
  leave_request_id uuid null references public.leave_requests(id) on delete set null,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

create index time_bank_transactions_employee_id_idx on public.time_bank_transactions (employee_id);
create index time_bank_transactions_leave_request_id_idx on public.time_bank_transactions (leave_request_id);

-- ---------------------------------------------------------------------------
-- Balance helper
-- ---------------------------------------------------------------------------
create or replace function public.time_bank_balance(p_employee_id uuid)
returns numeric
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce(sum(hours), 0)::numeric
  from public.time_bank_transactions
  where employee_id = p_employee_id;
$$;

-- ---------------------------------------------------------------------------
-- Auto-deduct on approval of personal leave
-- ---------------------------------------------------------------------------
create or replace function public.deduct_personal_leave_time_bank()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_hours numeric;
begin
  if NEW.status = 'approved'
     and OLD.status is distinct from 'approved'
     and NEW.leave_type = 'personal'
     and not exists (
       select 1 from public.time_bank_transactions where leave_request_id = NEW.id
     )
  then
    if NEW.schedule_type = 'full_day' then
      -- Jornada estándar de 8h por cada día hábil del rango (inclusive).
      v_hours := 8 * greatest(1, (NEW.end_date - NEW.start_date) + 1);
    else
      -- start_time/end_time are `time` columns. Fall back to 0 if missing/invalid.
      v_hours := coalesce(extract(epoch from (NEW.end_time - NEW.start_time)) / 3600, 0);
    end if;

    insert into public.time_bank_transactions (
      employee_id,
      hours,
      reason,
      leave_request_id,
      created_by
    ) values (
      NEW.employee_id,
      -v_hours,
      'Permiso aprobado ' || NEW.folio,
      NEW.id,
      (select auth.uid())
    );
  end if;

  return NEW;
end;
$$;

create trigger trg_deduct_personal_leave_time_bank
  after update on public.leave_requests
  for each row execute function public.deduct_personal_leave_time_bank();

-- ---------------------------------------------------------------------------
-- Client RPCs
-- ---------------------------------------------------------------------------
create or replace function public.get_my_time_bank()
returns numeric
language sql
stable security definer
set search_path to 'public'
as $$
  select public.time_bank_balance(auth.uid());
$$;

create or replace function public.get_time_bank_for(p_employee_id uuid)
returns numeric
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  is_hr boolean := private.current_user_role() = any (array['hr_admin'::user_role, 'admin'::user_role]);
  is_manager boolean;
begin
  if caller is null then
    return null;
  end if;

  select (manager_id = caller) into is_manager
  from public.profiles
  where id = p_employee_id;

  if not (caller = p_employee_id or is_manager or is_hr) then
    return null;
  end if;

  return public.time_bank_balance(p_employee_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.time_bank_transactions enable row level security;

CREATE POLICY time_bank_select_own ON public.time_bank_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (employee_id = ( SELECT auth.uid() AS uid));
CREATE POLICY time_bank_select_team ON public.time_bank_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY time_bank_select_hr ON public.time_bank_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]));
CREATE POLICY time_bank_insert_hr ON public.time_bank_transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.current_user_role() = ANY (ARRAY['hr_admin'::user_role, 'admin'::user_role]));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert on public.time_bank_transactions to authenticated, service_role;
revoke all on public.time_bank_transactions from anon;
grant execute on function public.time_bank_balance(uuid) to authenticated;
grant execute on function public.get_my_time_bank() to authenticated;
grant execute on function public.get_time_bank_for(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.time_bank_transactions;
