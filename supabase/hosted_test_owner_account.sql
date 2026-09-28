-- HOSTED TEST PROJECT ONLY — wtycqdnrulknhzheqflq
--
-- Idempotent, self-contained script to create the owner demo account in the
-- hosted Supabase test project. Safe to re-run: every step skips work when the
-- email, identity or profile already exists.
--
-- Uses the shared public demo password documented in the test-account guides.
-- This file must never be pointed at a real production dataset.
--
-- Run this script as `postgres` / service context from the SQL editor. Never run
-- it through a connection carrying an ordinary user's JWT: the BEFORE UPDATE
-- trigger `guard_profile_privileged_fields` would silently revert `role` to
-- `employee` and `is_test` to `false`, leaving a demo account visible to real
-- users.

-- ---------------------------------------------------------------------------
-- Role enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'owner'
  ) then
    alter type public.user_role add value 'owner';
    -- Commit inmediato: el valor nuevo de enum no puede usarse en la misma
    -- transacción en la que se agrega (SQLSTATE 55P04). El resto del script
    -- corre en la transacción siguiente.
    commit;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Auth user
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'owner.test@xignis.test',
  extensions.crypt('Xignis123!', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', 'Owner Test'),
  '',
  '',
  '',
  ''
where not exists (select 1 from auth.users where email = 'owner.test@xignis.test');

-- GoTrue refuses a password login when the user has no matching email identity,
-- so the row above is not enough on its own.
insert into auth.identities (
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id,
  u.id::text,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email = 'owner.test@xignis.test'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------
-- WARNING: run this script as `postgres` / service context. Running under an
-- ordinary user's JWT would make `guard_profile_privileged_fields` revert
-- `role` to `employee` and `is_test` to `false`.
insert into public.profiles (id, role, full_name, job_title, is_test)
select
  u.id,
  'owner'::public.user_role,
  'Owner Test',
  'Direccion General',
  true
from auth.users u
where u.email = 'owner.test@xignis.test'
on conflict (id) do update
set
  role = excluded.role,
  full_name = excluded.full_name,
  job_title = excluded.job_title,
  is_test = excluded.is_test;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
select
  u.email,
  p.role::text as role,
  p.is_test
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'owner.test@xignis.test';
