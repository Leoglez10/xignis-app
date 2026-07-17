-- Permite a cada usuario eliminar sus propias notificaciones (swipe / papelera en la app).
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete using (user_id = (select auth.uid()));
