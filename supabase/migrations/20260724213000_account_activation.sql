-- Activation-on-first-login: HR creates the account, no invite email is sent.
-- The employee types their email in the login screen and sets their own password.
--
-- Both helpers are SECURITY DEFINER because they read/write the auth schema, and
-- both are revoked from anon/authenticated: only the service role (Edge Functions)
-- may call them, so neither becomes a public email-enumeration endpoint.

-- Resolves an email to its auth user + whether it is still waiting for activation.
create or replace function public.account_activation_state(p_email text)
returns table (user_id uuid, pending boolean)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    coalesce((u.raw_user_meta_data ->> 'must_set_password')::boolean, false)
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and u.deleted_at is null
  limit 1;
$$;

revoke all on function public.account_activation_state(text) from public, anon, authenticated;
grant execute on function public.account_activation_state(text) to service_role;

-- Kills every active session of a user (HR "reset access").
-- ponytail: already-issued access tokens stay valid until they expire (~1h);
-- revoking those would need a JWT denylist, add it only if that hour matters.
create or replace function public.revoke_user_sessions(p_user_id uuid)
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.refresh_tokens where user_id = p_user_id::text;
  delete from auth.sessions where user_id = p_user_id;
$$;

revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;
