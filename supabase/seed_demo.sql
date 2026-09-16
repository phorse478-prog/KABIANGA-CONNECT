-- =========================================================
-- DEMO DATA — for local development only.
-- Every row here is clearly demo data (is_demo = true where the
-- column exists, and titles/descriptions say "DEMO").
-- Run AFTER schema.sql and after at least one real auth user
-- exists (needed as a placeholder seller/owner id).
-- =========================================================

insert into categories (name, slug, icon, sort_order) values
  ('Electronics', 'electronics', 'cpu', 1),
  ('Phones', 'phones', 'smartphone', 2),
  ('Laptops', 'laptops', 'laptop', 3),
  ('Clothes', 'clothes', 'shirt', 4),
  ('Shoes', 'shoes', 'footprints', 5),
  ('Books', 'books', 'book', 6),
  ('Furniture', 'furniture', 'sofa', 7),
  ('Food', 'food', 'utensils', 8),
  ('Beauty', 'beauty', 'sparkles', 9),
  ('Accessories', 'accessories', 'watch', 10),
  ('Other', 'other', 'box', 11)
on conflict (slug) do nothing;

-- NOTE: replace :demo_user with a real profile id from your `profiles`
-- table before running (e.g. your own test account) — do
-- `select id from profiles limit 1;` first.

-- Example (uncomment and fill in a real uuid):
-- insert into products (seller_id, category_id, title, description, price_kes, condition, location, status)
-- select
--   '00000000-0000-0000-0000-000000000000',
--   (select id from categories where slug = 'phones'),
--   'DEMO — Samsung Galaxy A24',
--   'Sample listing for development. Lightly used, comes with charger.',
--   18000,
--   'used',
--   'Kabianga Main Campus',
--   'active';

-- insert into products (seller_id, category_id, title, description, price_kes, condition, location, status) values
--   ('00000000-0000-0000-0000-000000000000', (select id from categories where slug='other'), 'DEMO — Scientific Calculator', 'Sample listing.', 800, 'used', 'Kabianga Town', 'active'),
--   ('00000000-0000-0000-0000-000000000000', (select id from categories where slug='books'), 'DEMO — Second-hand textbooks (bundle)', 'Sample listing.', 500, 'used', 'Kabianga Main Campus', 'active'),
--   ('00000000-0000-0000-0000-000000000000', (select id from categories where slug='shoes'), 'DEMO — Sneakers', 'Sample listing.', 2500, 'new', 'Kabianga Main Campus', 'active');

-- insert into hostels (owner_id, name, description, price_per_month, location, distance_from_campus_km, room_type, occupancy, gender_preference, has_water, has_electricity, has_wifi, has_security, is_demo, status) values
--   ('00000000-0000-0000-0000-000000000000', 'DEMO — Greenview Hostels', 'Sample hostel listing for development only.', 6500, 'Kaptebengwet', 0.8, 'bedsitter', 1, 'mixed', true, true, true, true, true, 'active');

-- insert into vendors (owner_id, name, description, location, offers_delivery, avg_prep_minutes, is_demo, status) values
--   ('00000000-0000-0000-0000-000000000000', 'DEMO — Mama Chichi Kitchen', 'Sample vendor for development only.', 'Near Gate B', true, 20, true, 'active');

-- Uncomment the block(s) above and replace the placeholder UUID once
-- you have created at least one real user profile locally.
