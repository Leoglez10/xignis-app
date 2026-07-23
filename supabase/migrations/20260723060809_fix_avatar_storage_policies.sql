-- The owner-scoped storage policies for the xignis-profiles bucket matched the
-- uploader against (storage.foldername(name))[0]. Postgres arrays are 1-indexed,
-- so that expression is always NULL and every avatar upload was denied by RLS.
--
-- The update policy also had no WITH CHECK, which would have let a user move
-- their own object into another user's folder.

drop policy if exists "Profiles: Users can upload their own avatar" on storage.objects;
drop policy if exists "Profiles: Users can update their own avatar" on storage.objects;

create policy "Profiles: Users can upload their own avatar"
  on storage.objects as permissive for insert to authenticated
  with check (bucket_id = 'xignis-profiles'::text and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Profiles: Users can update their own avatar"
  on storage.objects as permissive for update to authenticated
  using (bucket_id = 'xignis-profiles'::text and (auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'xignis-profiles'::text and (auth.uid())::text = (storage.foldername(name))[1]);
