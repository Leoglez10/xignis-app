revoke execute on function public.notify_leave_status_change() from public;
revoke execute on function public.notify_leave_status_change() from anon, authenticated;

revoke execute on function public.notify_new_leave_request() from public;
revoke execute on function public.notify_new_leave_request() from anon, authenticated;

revoke execute on function public.process_pending_invitations() from public;
revoke execute on function public.process_pending_invitations() from anon, authenticated;

revoke execute on function public.route_leave_request() from public;
revoke execute on function public.route_leave_request() from anon, authenticated;

alter function public.update_updated_at() set search_path = public;
