-- Align the folio trigger functions with the baseline convention: every trigger
-- function that matters there is executable only by postgres and service_role.
--
-- These two were left at the default grant, which the database linter flags as
-- "Public Can Execute SECURITY DEFINER Function". PostgREST cannot really invoke
-- a `returns trigger` function over /rpc, so this is defense in depth rather than
-- an open door — but the grant has no reason to exist either way.

revoke all on function public.assign_leave_request_folio() from public, anon, authenticated;
revoke all on function public.freeze_leave_request_folio() from public, anon, authenticated;
