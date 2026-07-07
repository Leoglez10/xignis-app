-- Trigger-only functions must not be callable via PostgREST RPC.
revoke execute on function public.route_leave_request() from anon, authenticated;
revoke execute on function public.notify_new_leave_request() from anon, authenticated;
revoke execute on function public.notify_leave_status_change() from anon, authenticated;
