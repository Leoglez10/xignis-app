create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'hr_admin', 'manager', 'employee');
  end if;

  if not exists (select 1 from pg_type where typname = 'leave_type') then
    create type public.leave_type as enum ('vacation', 'sick', 'personal', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'leave_status') then
    create type public.leave_status as enum (
      'pending_manager',
      'approved_by_manager',
      'rejected_by_manager',
      'pending_hr',
      'approved',
      'rejected',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'schedule_type') then
    create type public.schedule_type as enum ('full_day', 'time_range');
  end if;

  if not exists (select 1 from pg_type where typname = 'approval_decision') then
    create type public.approval_decision as enum ('approved', 'rejected');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'employee',
  full_name text not null,
  job_title text,
  manager_id uuid references public.profiles(id),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type public.leave_type not null,
  schedule_type public.schedule_type not null default 'full_day',
  start_time time,
  end_time time,
  pending_tasks text,
  status public.leave_status not null default 'pending_manager',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_dates_valid check (end_date >= start_date),
  constraint leave_time_valid check (
    schedule_type = 'full_day'
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create table if not exists public.leave_request_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references public.leave_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewer_role public.user_role not null,
  decision public.approval_decision not null,
  comment text,
  created_at timestamptz not null default now()
);

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function private.can_access_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select auth.uid()) = target_employee_id
    or exists (
      select 1
      from public.profiles employee
      where employee.id = target_employee_id
        and employee.manager_id = (select auth.uid())
    )
    or private.current_user_role() in ('hr_admin', 'admin'),
    false
  )
$$;

create or replace function private.can_manager_review(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    private.current_user_role() in ('manager', 'admin')
    and exists (
      select 1
      from public.profiles employee
      where employee.id = target_employee_id
        and employee.manager_id = (select auth.uid())
    ),
    false
  )
$$;

create or replace function private.can_hr_review()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(private.current_user_role() in ('hr_admin', 'admin'), false)
$$;

create or replace function public.xignis_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.xignis_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, job_title)
  values (
    new.id,
    'employee',
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'job_title', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.xignis_prepare_leave_request()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.employee_id = auth.uid();
    end if;

    new.reviewed_by = null;
    new.reviewed_at = null;
    new.rejection_reason = null;

    if exists (
      select 1
      from public.profiles p
      where p.id = new.employee_id
        and p.manager_id is not null
    ) then
      new.status = 'pending_manager';
    else
      new.status = 'pending_hr';
    end if;
  end if;

  if new.schedule_type = 'full_day' then
    new.start_time = null;
    new.end_time = null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.xignis_set_updated_at();

drop trigger if exists leave_requests_set_updated_at on public.leave_requests;
create trigger leave_requests_set_updated_at
before update on public.leave_requests
for each row execute function public.xignis_set_updated_at();

drop trigger if exists on_auth_user_created_xignis_profile on auth.users;
create trigger on_auth_user_created_xignis_profile
after insert on auth.users
for each row execute function public.xignis_handle_new_user();

insert into public.profiles (id, role, full_name, job_title)
select
  users.id,
  'employee',
  coalesce(nullif(users.raw_user_meta_data ->> 'full_name', ''), split_part(users.email, '@', 1)),
  nullif(users.raw_user_meta_data ->> 'job_title', '')
from auth.users
where not exists (
  select 1 from public.profiles profiles where profiles.id = users.id
);

drop trigger if exists leave_requests_prepare_insert on public.leave_requests;
create trigger leave_requests_prepare_insert
before insert on public.leave_requests
for each row execute function public.xignis_prepare_leave_request();

create index if not exists profiles_manager_id_idx on public.profiles(manager_id);
create index if not exists leave_requests_employee_id_idx on public.leave_requests(employee_id);
create index if not exists leave_requests_reviewed_by_idx on public.leave_requests(reviewed_by);
create index if not exists leave_requests_status_created_at_idx on public.leave_requests(status, created_at desc);
create index if not exists leave_requests_dates_idx on public.leave_requests(start_date, end_date);
create index if not exists leave_request_approvals_leave_request_id_idx on public.leave_request_approvals(leave_request_id);
create index if not exists leave_request_approvals_reviewer_id_idx on public.leave_request_approvals(reviewer_id);

alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_request_approvals enable row level security;

drop policy if exists profiles_select_own_team_or_hr on public.profiles;
create policy profiles_select_own_team_or_hr
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or manager_id = (select auth.uid())
  or private.current_user_role() in ('hr_admin', 'admin')
);

drop policy if exists profiles_insert_own_employee on public.profiles;
create policy profiles_insert_own_employee
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()) and role = 'employee');

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (private.current_user_role() = 'admin')
with check (private.current_user_role() = 'admin');

drop policy if exists leave_select_own_team_or_hr on public.leave_requests;
create policy leave_select_own_team_or_hr
on public.leave_requests
for select
to authenticated
using (private.can_access_employee(employee_id));

drop policy if exists leave_insert_own on public.leave_requests;
create policy leave_insert_own
on public.leave_requests
for insert
to authenticated
with check (
  employee_id = (select auth.uid())
  and status in ('pending_manager', 'pending_hr')
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists leave_employee_cancel_own on public.leave_requests;
drop policy if exists leave_manager_review_team on public.leave_requests;
drop policy if exists leave_hr_review on public.leave_requests;
drop policy if exists leave_update_by_actor on public.leave_requests;
create policy leave_update_by_actor
on public.leave_requests
for update
to authenticated
using (
  (
    employee_id = (select auth.uid())
    and status in ('pending_manager', 'pending_hr', 'approved_by_manager')
  )
  or (
    private.can_manager_review(employee_id)
    and status = 'pending_manager'
  )
  or (
    private.can_hr_review()
    and status in ('pending_hr', 'approved_by_manager')
  )
)
with check (
  (
    employee_id = (select auth.uid())
    and status = 'cancelled'
  )
  or (
    private.can_manager_review(employee_id)
    and status in ('approved_by_manager', 'rejected_by_manager')
    and reviewed_by = (select auth.uid())
    and reviewed_at is not null
  )
  or (
    private.can_hr_review()
    and status in ('approved', 'rejected')
    and reviewed_by = (select auth.uid())
    and reviewed_at is not null
  )
);

drop policy if exists approvals_select_visible_requests on public.leave_request_approvals;
create policy approvals_select_visible_requests
on public.leave_request_approvals
for select
to authenticated
using (
  exists (
    select 1
    from public.leave_requests lr
    where lr.id = leave_request_approvals.leave_request_id
      and private.can_access_employee(lr.employee_id)
  )
);

drop policy if exists approvals_insert_reviewer on public.leave_request_approvals;
create policy approvals_insert_reviewer
on public.leave_request_approvals
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and reviewer_role = private.current_user_role()
  and exists (
    select 1
    from public.leave_requests lr
    where lr.id = leave_request_approvals.leave_request_id
      and (
        private.can_manager_review(lr.employee_id)
        or private.can_hr_review()
      )
  )
);

grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.can_access_employee(uuid) to authenticated;
grant execute on function private.can_manager_review(uuid) to authenticated;
grant execute on function private.can_hr_review() to authenticated;

grant usage on schema public to authenticated;
grant usage on type public.user_role to authenticated;
grant usage on type public.leave_type to authenticated;
grant usage on type public.leave_status to authenticated;
grant usage on type public.schedule_type to authenticated;
grant usage on type public.approval_decision to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.leave_requests to authenticated;
grant select, insert on public.leave_request_approvals to authenticated;
revoke execute on function public.xignis_handle_new_user() from public, anon, authenticated;
