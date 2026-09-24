-- ============================================================================
-- Xignis HR — Repair: restore test-data guard + tighten policies
-- ----------------------------------------------------------------------------
-- Fixes issues found by the independent pre-merge verification:
--   1. 20260923190123 replaced profiles_select_own_team_or_hr and lost the
--      is_test guard from 20260728123000 (real users could see test profiles).
--   2. owner_requests_insert_own allowed ANY authenticated user to open an
--      owner request (spam vector); now restricted to the owner role.
--   3. time_bank_balance(uuid) is SECURITY DEFINER and was executable by
--      authenticated (and PUBLIC by default), leaking any employee's hour
--      balance; now only callable internally by the gated RPCs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles visibility: owner sees all, but test-data guard restored.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own_team_or_hr on public.profiles;
create policy profiles_select_own_team_or_hr on public.profiles
  as permissive for select to authenticated
  using (
    (
      id = (select auth.uid())
      or manager_id = (select auth.uid())
      or private.current_user_role() = any (array['hr_admin'::public.user_role, 'admin'::public.user_role])
      or private.is_owner()
    )
    and (
      is_test = false
      or id = (select auth.uid())
      or private.current_user_is_test()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Owner requests: only the owner role may open a request.
-- ---------------------------------------------------------------------------
drop policy if exists owner_requests_insert_own on public.owner_requests;
create policy owner_requests_insert_own on public.owner_requests
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.current_user_role() = 'owner'::public.user_role
  );

-- ---------------------------------------------------------------------------
-- 3. Hour bank balance: remove direct client access to the SECURITY DEFINER
--    helper; the gated RPCs (get_my_time_bank / get_time_bank_for) call it
--    internally as owner.
-- ---------------------------------------------------------------------------
revoke execute on function public.time_bank_balance(uuid) from public, authenticated;
revoke execute on function public.get_time_bank_for(uuid) from public;
grant execute on function public.get_time_bank_for(uuid) to authenticated;
revoke execute on function public.get_my_time_bank() from public;
grant execute on function public.get_my_time_bank() to authenticated;
