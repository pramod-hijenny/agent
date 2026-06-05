-- Storage RLS for the public "uploads" bucket.
--
-- Before this migration the only policy on storage.objects was the built-in
-- project_admin ALL policy, so every non-admin INSERT was denied with
-- "new row violates row-level security policy for table objects" — clip/post
-- media uploads (insforge.storage.from("uploads").upload(...)) all failed.
--
-- The bucket is public (public read is handled at the API layer), but writes
-- still need an explicit WITH CHECK policy. Objects are keyed as
-- `${auth.uid()}/posts/...` by the frontend (see src/lib/social-posts.ts and
-- src/hooks/useMediaAssets.ts), so we scope write/manage access to each user's
-- own folder. Mirrors the {public}-role + auth.uid() convention used by the
-- profiles table.

-- Authenticated users may upload into their own folder.
DROP POLICY IF EXISTS uploads_owner_insert ON storage.objects;
CREATE POLICY uploads_owner_insert ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket = 'uploads'
    AND auth.uid() IS NOT NULL
    AND key LIKE (auth.uid())::text || '/%'
  );

-- Anyone may read objects in the public bucket (download + list).
DROP POLICY IF EXISTS uploads_public_select ON storage.objects;
CREATE POLICY uploads_public_select ON storage.objects
  FOR SELECT TO public
  USING (bucket = 'uploads');

-- Owners may overwrite their own objects.
DROP POLICY IF EXISTS uploads_owner_update ON storage.objects;
CREATE POLICY uploads_owner_update ON storage.objects
  FOR UPDATE TO public
  USING (bucket = 'uploads' AND key LIKE (auth.uid())::text || '/%')
  WITH CHECK (bucket = 'uploads' AND key LIKE (auth.uid())::text || '/%');

-- Owners may delete their own objects.
DROP POLICY IF EXISTS uploads_owner_delete ON storage.objects;
CREATE POLICY uploads_owner_delete ON storage.objects
  FOR DELETE TO public
  USING (bucket = 'uploads' AND key LIKE (auth.uid())::text || '/%');
