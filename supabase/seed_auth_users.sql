-- LOCAL DEVELOPMENT ONLY.
--
-- Seeds run on `supabase db reset`, which only ever targets the local stack —
-- `supabase db push` does not run them. Every account here uses a throwaway
-- @xignis.test address and a shared, publicly known password, so this file must
-- never be pointed at a hosted project.
--
-- Password for all four accounts: Xignis123!
-- (same one documented in docs/supabase-test-setup.md for the hosted project,
-- so there is a single test password across environments)
--
-- seed_test_accounts.sql runs right after this one and joins auth.users by
-- email to assign the real roles; on its own it finds nothing on a fresh
-- database, because there are no auth users to join against yet.

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
  data.email,
  extensions.crypt('Xignis123!', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', data.full_name),
  '',
  '',
  '',
  ''
from (
  values
    ('carlos.manager@xignis.test', 'Carlos Manager'),
    ('maria.hr@xignis.test', 'Maria HR'),
    ('admin.tech@xignis.test', 'Admin Tecnico'),
    ('ana.employee@xignis.test', 'Ana Employee')
) as data(email, full_name)
where not exists (select 1 from auth.users u where u.email = data.email);

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
where u.email like '%@xignis.test'
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );
