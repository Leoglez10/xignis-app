# Xignis App - Modelo de Datos

## Principio base

Supabase Auth es la fuente de identidad. La tabla publica se llama `profiles` para evitar confusion con `auth.users`.

## Enums

```sql
create type user_role as enum ('admin', 'hr_admin', 'manager', 'employee');
create type leave_type as enum ('vacation', 'sick', 'personal', 'other');
create type leave_status as enum (
  'pending_manager',
  'approved_by_manager',
  'rejected_by_manager',
  'pending_hr',
  'approved',
  'rejected',
  'cancelled'
);
create type schedule_type as enum ('full_day', 'time_range');
create type approval_decision as enum ('approved', 'rejected');
```

## Tabla `profiles`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'employee',
  full_name text not null,
  job_title text,
  manager_id uuid references public.profiles(id),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Tabla `leave_requests`

```sql
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type leave_type not null,
  schedule_type schedule_type not null default 'full_day',
  start_time time,
  end_time time,
  pending_tasks text,
  status leave_status not null default 'pending_manager',
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
```

## Tabla `leave_request_approvals`

Auditoria por cada revision de manager o RH.

```sql
create table public.leave_request_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null references public.leave_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewer_role user_role not null,
  decision approval_decision not null,
  comment text,
  created_at timestamptz not null default now()
);
```

## RLS actual

```sql
alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_request_approvals enable row level security;
```

Resumen funcional de las policies:

- `profiles`: cada usuario ve su propio perfil, su manager directo y roles RH/admin.
- `leave_requests`: el empleado ve lo suyo; manager ve lo de su equipo; RH/admin ve lo que corresponde a su nivel.
- `leave_requests` insert: solo el empleado autenticado para si mismo.
- `leave_requests` update: una sola policy consolida cancelacion de empleado, revision de manager y revision de RH.
- `leave_request_approvals` select: solo sobre solicitudes visibles para el usuario.
- `leave_request_approvals` insert: solo quien revisa y solo si tiene permiso para esa solicitud.

## Implementacion actual en Supabase

La migracion aplicada fue:

```txt
supabase/migrations/20260628163000_create_profiles_leave_requests.sql
```

Incluye tambien:

- trigger para crear `profiles` al insertar usuarios nuevos en `auth.users`
- backfill idempotente para usuarios Auth existentes sin perfil
- indices para consultas por equipo, fechas y auditoria

## Pendiente por decidir

- Si se migran o eliminan las tablas antiguas en espanol.
- Si manager y RH requieren detalle dedicado por ruta.
- Si se agrega vista materializada o reporte exportable.
