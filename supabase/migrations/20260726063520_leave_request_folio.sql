-- Human-readable folio (XG-2026-0142) for leave requests.
--
-- The UI was showing the UUID primary key under the "Folio" label: 36 characters,
-- impossible to read out over the phone, and only searchable by pasting it whole.
-- The folio is now its own column, sequential per calendar year.

-- Trigger-only state: one row per year holding the last number handed out.
create table public.leave_request_folio_counters (
  year int primary key,
  last_value int not null default 0
);

-- No RLS policy on purpose. The rls_auto_enable event trigger turns RLS on for
-- this table, and with zero policies every client read/write is denied; the
-- SECURITY DEFINER trigger below is the only thing that touches it.
revoke all on table public.leave_request_folio_counters from anon, authenticated;

alter table public.leave_requests add column folio text;

-- Backfill: number the existing rows per creation year, oldest first.
with numbered as (
  select
    id,
    extract(year from created_at)::int as year,
    row_number() over (partition by extract(year from created_at) order by created_at, id) as seq
  from public.leave_requests
)
update public.leave_requests r
set folio = 'XG-' || numbered.year || '-' || lpad(numbered.seq::text, 4, '0')
from numbered
where numbered.id = r.id;

insert into public.leave_request_folio_counters (year, last_value)
select extract(year from created_at)::int, count(*)
from public.leave_requests
group by 1;

alter table public.leave_requests
  alter column folio set not null,
  add constraint leave_requests_folio_key unique (folio);

-- The folio is assigned server-side and always overwritten, so a client cannot
-- pick its own number by sending one in the insert payload.
--
-- ponytail: the counter year comes from now() in UTC, so a request created in
-- the last hours of Dec 31 local time lands in the next year's sequence. Wrap it
-- in `at time zone` only if that boundary ever matters.
create or replace function public.assign_leave_request_folio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_next int;
begin
  insert into public.leave_request_folio_counters as c (year, last_value)
  values (v_year, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into v_next;

  new.folio := 'XG-' || v_year || '-' || lpad(v_next::text, 4, '0');
  return new;
end;
$$;

create trigger leave_requests_assign_folio
  before insert on public.leave_requests
  for each row execute function public.assign_leave_request_folio();

-- The folio is an audit identifier, so it is immutable. leave_update_by_actor
-- lets the employee, their manager and HR run UPDATE on the row, and its WITH
-- CHECK says nothing about this column, so without this guard any of them could
-- PATCH the folio to another value.
create or replace function public.freeze_leave_request_folio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.folio := old.folio;
  return new;
end;
$$;

create trigger leave_requests_freeze_folio
  before update on public.leave_requests
  for each row execute function public.freeze_leave_request_folio();

-- ponytail: no trigram index for the `ilike '%term%'` folio search. The unique
-- btree already covers exact lookups; add pg_trgm when the table outgrows a scan.
