-- =========================================================
-- Phase 3 additions — chat, notifications, resource categories,
-- resource downloads.
-- Run this AFTER schema.sql (and after seed_demo.sql if you used it).
-- =========================================================

-- Notifications: the schema so far only let users read/update their
-- OWN notifications. To let one user's action (a message, an order
-- status change, a listing approval) create a notification for a
-- DIFFERENT user, we need an insert policy. We deliberately keep this
-- narrow — any logged-in user can create a notification row for
-- someone else, but still can never read or modify anyone else's
-- notifications (the existing select/update policies still apply).
create policy "Authenticated users can create notifications"
  on notifications for insert
  with check (auth.uid() is not null);

-- Resources: add the category field used by the browse/upload UI
-- (Notes / Revision materials / Past papers / Study guides / Course
-- materials), which the original schema didn't yet include.
alter table resources
  add column if not exists category text
  check (category in ('notes', 'revision_materials', 'past_papers', 'study_guides', 'course_materials'));

create index if not exists resources_category_idx on resources(category);

-- Resource downloads: any student should be able to bump the download
-- counter on an approved resource, but should NOT get a blanket
-- update policy on the resources table (that would let anyone edit
-- someone else's title/description). A security-definer function
-- gives a narrow, safe way to do just that one thing.
create or replace function increment_resource_downloads(resource_id uuid)
returns void as $$
  update resources
  set download_count = download_count + 1
  where id = resource_id and status = 'active';
$$ language sql security definer;

revoke all on function increment_resource_downloads(uuid) from public;
grant execute on function increment_resource_downloads(uuid) to authenticated;
