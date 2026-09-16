-- =========================================================
-- Phase 3 additions — schema changes
-- Run this BEFORE phase3_triggers.sql, after schema.sql.
-- =========================================================

-- Resources also have a flat category (Notes, Past papers, etc.)
-- in addition to the School → Department → Course → Unit hierarchy.
alter table resources
  add column if not exists category text
    check (category in ('notes', 'revision_materials', 'past_papers', 'study_guides', 'course_materials'));

create index if not exists resources_category_idx on resources(category);

-- Atomic download counter — avoids a read-then-write race when many
-- students download the same file around the same time.
create or replace function increment_resource_downloads(resource_id uuid)
returns void as $$
  update resources set download_count = download_count + 1 where id = resource_id;
$$ language sql security definer;

-- Events favoriting already works through the generic `favorites`
-- table from schema.sql (target_type = 'event') — no changes needed.
