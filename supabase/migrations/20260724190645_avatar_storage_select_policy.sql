-- Avatar uploads use `upsert: true`, which storage-api runs as
-- INSERT ... ON CONFLICT (bucket_id, name) DO UPDATE. Postgres requires a
-- SELECT policy on the target table for that statement, and the xignis-profiles
-- bucket had none, so every upload failed with
-- "new row violates row-level security policy".
--
-- The bucket is public, so its objects are already world-readable over the CDN;
-- this policy only mirrors that at the row level.

create policy "Profiles: Anyone can read avatars"
  on storage.objects as permissive for select to authenticated, anon
  using (bucket_id = 'xignis-profiles'::text);
