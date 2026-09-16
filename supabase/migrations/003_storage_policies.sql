-- =========================================================
-- Phase 3 fix — Storage RLS policies
--
-- schema.sql enables RLS on every table, but Supabase Storage keeps
-- its own RLS on the storage.objects table, separate from anything
-- in the `public` schema. Without these policies, uploads from
-- marketplace/new, hostels/new, and resources/new will fail with a
-- permission error even after the buckets exist.
--
-- BEFORE running this: create these buckets in the Supabase
-- dashboard (Storage → New bucket), all with "Public bucket" ON:
--   product-images
--   hostel-images
--   resources
--
-- All three upload flows write to a path starting with the
-- uploader's own user id (e.g. `${user.id}/${productId}/...`), so
-- these policies scope writes to "your own folder" using that
-- convention — (storage.foldername(name))[1] is the first path
-- segment.
-- =========================================================

-- Public read (matches the buckets' own "public" setting, and also
-- covers the Storage API — not just the public CDN URL).
create policy "Public read for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public read for hostel images"
  on storage.objects for select
  using (bucket_id = 'hostel-images');

create policy "Public read for resources"
  on storage.objects for select
  using (bucket_id = 'resources');

-- Authenticated users can upload only into their own folder.
create policy "Users upload their own product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users upload their own hostel images"
  on storage.objects for insert
  with check (
    bucket_id = 'hostel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users upload their own resources"
  on storage.objects for insert
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners (or admins) can replace/delete their own files.
create policy "Users manage their own product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users delete their own product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users manage their own hostel images"
  on storage.objects for update
  using (
    bucket_id = 'hostel-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users delete their own hostel images"
  on storage.objects for delete
  using (
    bucket_id = 'hostel-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users manage their own resource files"
  on storage.objects for update
  using (
    bucket_id = 'resources'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Users delete their own resource files"
  on storage.objects for delete
  using (
    bucket_id = 'resources'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
