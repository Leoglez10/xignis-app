-- Exponer leave_requests y leave_request_approvals a Realtime para que el frontend
-- pueda suscribirse a cambios de estado y nuevas aprobaciones en vivo.
-- RLS ya scopea qué filas puede ver cada rol, así que la publicación es segura.
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.leave_request_approvals;
