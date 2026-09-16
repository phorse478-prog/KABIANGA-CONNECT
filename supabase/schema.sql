-- =========================================================
-- Kabianga Connect — Phase 1 & foundation schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type user_role as enum ('student', 'seller', 'service_provider', 'hostel_owner', 'food_vendor', 'admin');
create type listing_status as enum ('draft', 'pending', 'active', 'rejected', 'sold', 'archived');
create type order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- ---------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  campus_year text,
  bio text,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A user can hold more than one role (e.g. student + seller)
create table user_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------
-- CATEGORIES (shared across marketplace)
-- ---------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text,
  sort_order int not null default 0
);

-- ---------------------------------------------------------
-- MARKETPLACE: PRODUCTS
-- ---------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  title text not null,
  description text,
  price_kes numeric(12,2) not null check (price_kes >= 0),
  condition text check (condition in ('new', 'used', 'refurbished')),
  location text,
  status listing_status not null default 'pending',
  is_featured boolean not null default false,
  featured_until timestamptz,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_seller_idx on products(seller_id);
create index products_category_idx on products(category_id);
create index products_status_idx on products(status);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on product_images(product_id);

-- ---------------------------------------------------------
-- HOSTELS
-- ---------------------------------------------------------
create table hostels (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  price_per_month numeric(12,2) not null check (price_per_month >= 0),
  location text not null,
  distance_from_campus_km numeric(5,2),
  room_type text check (room_type in ('single', 'shared', 'bedsitter', 'one_bedroom', 'other')),
  occupancy int,
  gender_preference text check (gender_preference in ('male', 'female', 'mixed')),
  has_water boolean not null default false,
  has_electricity boolean not null default false,
  has_wifi boolean not null default false,
  has_security boolean not null default false,
  has_parking boolean not null default false,
  status listing_status not null default 'pending',
  is_featured boolean not null default false,
  featured_until timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hostels_owner_idx on hostels(owner_id);
create index hostels_status_idx on hostels(status);

create table hostel_images (
  id uuid primary key default uuid_generate_v4(),
  hostel_id uuid not null references hostels(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table hostel_reviews (
  id uuid primary key default uuid_generate_v4(),
  hostel_id uuid not null references hostels(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (hostel_id, reviewer_id)
);

-- ---------------------------------------------------------
-- FOOD VENDORS
-- ---------------------------------------------------------
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  location text,
  offers_delivery boolean not null default true,
  avg_prep_minutes int,
  status listing_status not null default 'pending',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  description text,
  price_kes numeric(12,2) not null check (price_kes >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index menu_items_vendor_idx on menu_items(vendor_id);

-- ---------------------------------------------------------
-- ORDERS  (food orders; product orders reuse the same tables via order_type)
-- ---------------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  order_type text not null check (order_type in ('food', 'product')),
  vendor_id uuid references vendors(id),
  seller_id uuid references profiles(id),
  status order_status not null default 'pending',
  subtotal_kes numeric(12,2) not null default 0,
  delivery_fee_kes numeric(12,2) not null default 0,
  commission_kes numeric(12,2) not null default 0,
  total_kes numeric(12,2) not null default 0,
  delivery_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_idx on orders(buyer_id);
create index orders_vendor_idx on orders(vendor_id);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  product_id uuid references products(id),
  quantity int not null default 1 check (quantity > 0),
  unit_price_kes numeric(12,2) not null,
  line_total_kes numeric(12,2) not null
);
create index order_items_order_idx on order_items(order_id);

-- ---------------------------------------------------------
-- STUDENT GIGS / SERVICES
-- ---------------------------------------------------------
create table services (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  starting_price_kes numeric(12,2),
  status listing_status not null default 'pending',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_provider_idx on services(provider_id);

create table service_requests (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references services(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  message text,
  status text not null default 'open' check (status in ('open', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- REVIEWS (generic, for sellers / providers / vendors)
-- ---------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('seller', 'service', 'vendor')),
  target_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_target_idx on reviews(target_type, target_id);

-- ---------------------------------------------------------
-- MESSAGING
-- ---------------------------------------------------------
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_one uuid not null references profiles(id) on delete cascade,
  participant_two uuid not null references profiles(id) on delete cascade,
  context_type text check (context_type in ('product', 'hostel', 'service', 'vendor', 'general')),
  context_id uuid,
  created_at timestamptz not null default now(),
  unique (participant_one, participant_two, context_type, context_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on messages(conversation_id);

-- ---------------------------------------------------------
-- ACADEMIC RESOURCES
-- ---------------------------------------------------------
create table resources (
  id uuid primary key default uuid_generate_v4(),
  uploader_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  school text,
  department text,
  course text,
  unit text,
  storage_path text not null,
  download_count int not null default 0,
  status listing_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index resources_course_idx on resources(school, department, course, unit);

-- ---------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------
create table events (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid references profiles(id),
  title text not null,
  description text,
  category text check (category in ('clubs', 'sports', 'entertainment', 'academic', 'career', 'business', 'other')),
  image_url text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status listing_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- FAVORITES / NOTIFICATIONS
-- ---------------------------------------------------------
create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('product', 'hostel', 'service', 'vendor', 'event')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id);

-- ---------------------------------------------------------
-- PAYMENTS / COMMISSIONS / FEATURED LISTINGS  (abstraction only — no real M-Pesa yet)
-- ---------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id),
  payer_id uuid not null references profiles(id),
  amount_kes numeric(12,2) not null,
  provider text not null default 'mpesa_stub',
  provider_reference text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table commissions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id),
  rate_percent numeric(5,2) not null,
  amount_kes numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table featured_listings (
  id uuid primary key default uuid_generate_v4(),
  target_type text not null check (target_type in ('product', 'hostel', 'service')),
  target_id uuid not null,
  tier text not null check (tier in ('featured', 'premium')),
  price_kes numeric(12,2) not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  payment_id uuid references payments(id)
);

-- ---------------------------------------------------------
-- REPORTS / MODERATION
-- ---------------------------------------------------------
create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PLATFORM SETTINGS (admin-configurable fees)
-- ---------------------------------------------------------
create table platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into platform_settings (key, value) values
  ('commission_rate_percent', '7.5'),
  ('vendor_commission_rate_percent', '10'),
  ('featured_price_kes', '{"featured": 50, "premium": 100}');

-- =========================================================
-- updated_at trigger helper
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_products_updated before update on products for each row execute function set_updated_at();
create trigger trg_hostels_updated before update on hostels for each row execute function set_updated_at();
create trigger trg_vendors_updated before update on vendors for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();
create trigger trg_services_updated before update on services for each row execute function set_updated_at();
create trigger trg_payments_updated before update on payments for each row execute function set_updated_at();

-- =========================================================
-- Auto-create a profile row whenever a new auth user signs up
-- =========================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New Student'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table hostels enable row level security;
alter table hostel_images enable row level security;
alter table hostel_reviews enable row level security;
alter table vendors enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table services enable row level security;
alter table service_requests enable row level security;
alter table reviews enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table resources enable row level security;
alter table events enable row level security;
alter table favorites enable row level security;
alter table notifications enable row level security;
alter table payments enable row level security;
alter table commissions enable row level security;
alter table featured_listings enable row level security;
alter table reports enable row level security;
alter table platform_settings enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- PROFILES
create policy "Profiles are publicly viewable" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on profiles for update using (is_admin());

-- USER ROLES
create policy "Roles are publicly viewable" on user_roles for select using (true);
create policy "Users can request their own non-admin roles" on user_roles
  for insert with check (auth.uid() = user_id and role <> 'admin');
create policy "Admins manage roles" on user_roles for all using (is_admin());

-- CATEGORIES (public read, admin write)
create policy "Categories are publicly viewable" on categories for select using (true);
create policy "Admins manage categories" on categories for all using (is_admin());

-- PRODUCTS
create policy "Active products are publicly viewable" on products
  for select using (status = 'active' or seller_id = auth.uid() or is_admin());
create policy "Sellers manage their own products" on products
  for insert with check (auth.uid() = seller_id);
create policy "Sellers update their own products" on products
  for update using (auth.uid() = seller_id or is_admin());
create policy "Sellers delete their own products" on products
  for delete using (auth.uid() = seller_id or is_admin());

create policy "Product images follow product visibility" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_id and (p.status = 'active' or p.seller_id = auth.uid() or is_admin()))
  );
create policy "Sellers manage images of their own products" on product_images
  for all using (
    exists (select 1 from products p where p.id = product_id and (p.seller_id = auth.uid() or is_admin()))
  );

-- HOSTELS
create policy "Active hostels are publicly viewable" on hostels
  for select using (status = 'active' or owner_id = auth.uid() or is_admin());
create policy "Owners manage their own hostels" on hostels
  for insert with check (auth.uid() = owner_id);
create policy "Owners update their own hostels" on hostels
  for update using (auth.uid() = owner_id or is_admin());
create policy "Owners delete their own hostels" on hostels
  for delete using (auth.uid() = owner_id or is_admin());

create policy "Hostel images follow hostel visibility" on hostel_images
  for select using (
    exists (select 1 from hostels h where h.id = hostel_id and (h.status = 'active' or h.owner_id = auth.uid() or is_admin()))
  );
create policy "Owners manage images of their own hostels" on hostel_images
  for all using (
    exists (select 1 from hostels h where h.id = hostel_id and (h.owner_id = auth.uid() or is_admin()))
  );

create policy "Hostel reviews are publicly viewable" on hostel_reviews for select using (true);
create policy "Students can review hostels" on hostel_reviews for insert with check (auth.uid() = reviewer_id);
create policy "Reviewers manage their own reviews" on hostel_reviews for update using (auth.uid() = reviewer_id);
create policy "Reviewers delete their own reviews" on hostel_reviews for delete using (auth.uid() = reviewer_id or is_admin());

-- VENDORS / MENU ITEMS
create policy "Active vendors are publicly viewable" on vendors
  for select using (status = 'active' or owner_id = auth.uid() or is_admin());
create policy "Vendor owners manage their vendor profile" on vendors
  for all using (auth.uid() = owner_id or is_admin()) with check (auth.uid() = owner_id or is_admin());

create policy "Menu items follow vendor visibility" on menu_items
  for select using (
    exists (select 1 from vendors v where v.id = vendor_id and (v.status = 'active' or v.owner_id = auth.uid() or is_admin()))
  );
create policy "Vendor owners manage their menu items" on menu_items
  for all using (
    exists (select 1 from vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or is_admin()))
  );

-- ORDERS
create policy "Buyers and counterparties can view their orders" on orders
  for select using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
    or is_admin()
  );
create policy "Buyers create orders" on orders for insert with check (auth.uid() = buyer_id);
create policy "Order counterparties can update status" on orders
  for update using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
    or is_admin()
  );

create policy "Order items follow order visibility" on order_items
  for select using (
    exists (
      select 1 from orders o where o.id = order_id
      and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id or is_admin()
           or exists (select 1 from vendors v where v.id = o.vendor_id and v.owner_id = auth.uid()))
    )
  );
create policy "Buyers create order items with their order" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
  );

-- SERVICES
create policy "Active services are publicly viewable" on services
  for select using (status = 'active' or provider_id = auth.uid() or is_admin());
create policy "Providers manage their own services" on services
  for all using (auth.uid() = provider_id or is_admin()) with check (auth.uid() = provider_id or is_admin());

create policy "Service requests visible to requester and provider" on service_requests
  for select using (
    auth.uid() = requester_id
    or exists (select 1 from services s where s.id = service_id and s.provider_id = auth.uid())
    or is_admin()
  );
create policy "Students create service requests" on service_requests
  for insert with check (auth.uid() = requester_id);
create policy "Provider or requester updates request status" on service_requests
  for update using (
    auth.uid() = requester_id
    or exists (select 1 from services s where s.id = service_id and s.provider_id = auth.uid())
    or is_admin()
  );

-- REVIEWS
create policy "Reviews are publicly viewable" on reviews for select using (true);
create policy "Users create their own reviews" on reviews for insert with check (auth.uid() = reviewer_id);
create policy "Users manage their own reviews" on reviews for update using (auth.uid() = reviewer_id);
create policy "Users delete their own reviews" on reviews for delete using (auth.uid() = reviewer_id or is_admin());

-- CONVERSATIONS / MESSAGES
create policy "Participants can view their conversations" on conversations
  for select using (auth.uid() = participant_one or auth.uid() = participant_two or is_admin());
create policy "Users start conversations they are part of" on conversations
  for insert with check (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Participants can view their messages" on messages
  for select using (
    exists (
      select 1 from conversations c where c.id = conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    ) or is_admin()
  );
create policy "Participants send messages" on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations c where c.id = conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );
create policy "Recipients mark messages read" on messages
  for update using (
    exists (
      select 1 from conversations c where c.id = conversation_id
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- RESOURCES
create policy "Approved resources are publicly viewable" on resources
  for select using (status = 'active' or uploader_id = auth.uid() or is_admin());
create policy "Students upload resources" on resources for insert with check (auth.uid() = uploader_id);
create policy "Uploaders manage their own resources" on resources
  for update using (auth.uid() = uploader_id or is_admin());
create policy "Uploaders delete their own resources" on resources
  for delete using (auth.uid() = uploader_id or is_admin());

-- EVENTS
create policy "Approved events are publicly viewable" on events
  for select using (status = 'active' or organizer_id = auth.uid() or is_admin());
create policy "Organizers create events" on events for insert with check (auth.uid() = organizer_id or is_admin());
create policy "Organizers manage their own events" on events
  for update using (auth.uid() = organizer_id or is_admin());

-- FAVORITES
create policy "Users manage their own favorites" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTIFICATIONS
create policy "Users view their own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users mark their own notifications read" on notifications for update using (auth.uid() = user_id);

-- PAYMENTS / COMMISSIONS / FEATURED LISTINGS
create policy "Payers view their own payments" on payments for select using (auth.uid() = payer_id or is_admin());
create policy "Admins manage commissions" on commissions for all using (is_admin());
create policy "Featured listings are publicly viewable" on featured_listings for select using (true);
create policy "Admins manage featured listings" on featured_listings for all using (is_admin());

-- REPORTS
create policy "Reporters view their own reports" on reports for select using (auth.uid() = reporter_id or is_admin());
create policy "Users file reports" on reports for insert with check (auth.uid() = reporter_id);
create policy "Admins manage all reports" on reports for update using (is_admin());

-- PLATFORM SETTINGS
create policy "Settings are publicly viewable" on platform_settings for select using (true);
create policy "Admins manage settings" on platform_settings for all using (is_admin());
