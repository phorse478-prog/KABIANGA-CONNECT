# Kabianga Connect

**Campus life, connected.** A student marketplace and campus-services app
for University of Kabianga students — marketplace, hostels, food, gigs,
resources, and events, in one place.

This repo now covers **Phases 1–3** of the plan: marketplace,
hostels, food ordering, gigs, chat, notifications, academic
resources, and events are all built end-to-end. Only Phase 4
(M-Pesa, paid featured listings, premium accounts) remains — the
tables for it already exist (see below).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Row Level Security, Storage)
- Framer Motion (for later polish — not required for Phase 1)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema, in order.** In the Supabase SQL editor, run:

   ```
   supabase/schema.sql
   supabase/migrations/002_phase3.sql
   supabase/migrations/003_storage_policies.sql
   ```

   `schema.sql` creates every table for all four phases (marketplace,
   hostels, food, gigs, resources, events, messaging, payments,
   reports, etc.), enables Row Level Security everywhere, and sets
   sensible policies (e.g. sellers can only edit their own products;
   only admins can approve listings or change roles).

   `002_phase3.sql` adds what Phase 3 needed on top of that: a
   `category` column on `resources`, an insert policy so one user's
   action can create a notification for another user, and a
   `security definer` function so any student can bump a resource's
   download counter without a blanket update policy on the table.

   `003_storage_policies.sql` adds Row Level Security on
   `storage.objects` for the three buckets below. You can run this
   before or after creating the buckets (the policies just filter by
   bucket name, no dependency either way) — but until *both* the
   buckets exist *and* this file has run, every photo/file upload in
   the app will fail with a permission error, because table-level RLS
   and Storage RLS are separate systems in Supabase.

4. **Create storage buckets** (Storage → New bucket → public read):
   `product-images`, `hostel-images`, `resources`. (`vendor-images`
   and `menu-item-images` aren't needed yet — the food section
   currently stores plain image URLs rather than uploads.)

5. **Enable Realtime on `messages`.** In Supabase: Database → 
   Replication → toggle on the `messages` table (or run
   `alter publication supabase_realtime add table messages;` in the
   SQL editor). Without this, chat still works but won't update live
   — the other person would need to refresh to see a new message.

6. **Copy environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from your Supabase project settings. Only add
   `SUPABASE_SERVICE_ROLE_KEY` if/when you build a server-only admin
   action that genuinely needs to bypass RLS — never expose it to the
   client, and never prefix it with `NEXT_PUBLIC_`.

7. **Generate real database types** (replace the placeholder in
   `src/lib/database.types.ts`):

   ```bash
   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/database.types.ts
   ```

8. **Make yourself an admin.** After signing up once through the app,
   run in the SQL editor:

   ```sql
   insert into user_roles (user_id, role)
   values ('<your-user-id-from-auth.users>', 'admin');
   ```

   (Admin can never be self-assigned through the app — this is by
   design, per the RLS policy on `user_roles`.)

9. **Seed demo data (optional).** Open `supabase/seed_demo.sql`,
   uncomment the blocks, replace the placeholder UUID with a real
   profile id, and run it. Every demo row is prefixed `DEMO —` and/or
   flagged `is_demo = true` so it's never confused with real listings.

10. **Run the app**

   ```bash
   npm run dev
   ```

## Vercel environments

Import the repository into Vercel and keep the default Next.js framework
settings. Add these variables under **Project Settings -> Environment
Variables**:

| Variable | Development | Preview | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | same project URL | same project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | same key | same key |
| `NEXT_PUBLIC_SITE_NAME` | `Kabianga Connect` | `Kabianga Connect` | `Kabianga Connect` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Vercel preview URL | production domain URL |
| `NEXT_PUBLIC_SITE_PUBLISHABLE_KEY` | publishable key, if used | same key | same key |

Only add `SUPABASE_SERVICE_ROLE_KEY` to Vercel when a server-only action
requires it, and scope it to the environments that need it. Never prefix
this variable with `NEXT_PUBLIC_`. After changing variables, redeploy so
the new values are available to the build and server functions.

## What's built (Phase 1)

- [x] Email/password auth (register with role selection, login, logout)
- [x] Auto-created profile row + role table (multi-role support)
- [x] Home dashboard (quick actions, trending products, hostels,
      services, food vendors — with real empty states, not fake data)
- [x] Marketplace: category filter, search, product detail page
- [x] "Create listing" flow with photo upload to Supabase Storage
      (goes to `pending` until an admin approves it)
- [x] Admin dashboard: stats, pending-listings queue (approve/reject),
      user management (verify/suspend)
- [x] Middleware-based route protection for `/profile`, `/marketplace/new`,
      `/admin`
- [x] Full database schema + RLS for **all four phases**, so later
      phases don't require schema rewrites

## What's built (Phase 2)

- [x] Hostel finder: browse + filters (price, room type, gender,
      amenities), detail page with amenities/gallery/reviews, owner
      "list a hostel" form with photo upload
- [x] Student gigs: browse by category, gig detail page, request-a-service
      form, provider "offer a service" form
- [x] Food ordering: vendor list, vendor page with live menu + cart,
      delivery/pickup toggle, order placement (writes `orders` +
      `order_items`)
- [x] Vendor dashboard (`/food/manage`): create vendor profile, add/
      toggle/remove menu items, manage incoming orders through the
      full status flow (pending → accepted → preparing → ready → out
      for delivery → delivered, or cancelled)
- [x] Buyer order history (`/orders`) and order tracking page
      (`/orders/[id]`) with a visual progress bar for food orders
- [x] Reviews: star-rating form + list, reused across hostels,
      services, and vendors (dedicated `hostel_reviews` table for
      hostels, generic `reviews` table for services/vendors)
- [x] Route protection extended to all new write routes
      (`/hostels/new`, `/gigs/new`, `/food/manage`, `/orders`)

## What's next (per the phased plan)

**Phase 4** — M-Pesa integration behind the existing `payments`
abstraction (Daraja API), paid featured listings, configurable
platform/vendor commissions, premium student accounts.

The `payments`, `commissions`, and `featured_listings` tables already
exist and are wired for `pending/paid/failed/refunded` states — Phase 4
is about plugging in a real payment provider behind that interface, not
designing new tables. Order commission amounts are already computed at
order-placement time using the admin-configurable
`platform_settings.vendor_commission_rate_percent` value.

## What's built (Phase 3)

- [x] Chat: conversation list (`/messages`) and realtime thread
      (`/messages/[id]`) over Supabase Realtime, with block/report
      affordances. "Chat seller" / "Message owner" buttons on
      marketplace and hostel listings start (or resume) a
      conversation automatically.
- [x] Notifications: `/notifications` with mark-all-read, a live
      unread-count badge in the nav bar, and mobile quick links from
      the profile page. Fires on new messages, new service requests,
      order status changes, and admin approve/reject decisions.
- [x] Academic resources: browse by category with search
      (`/resources`), upload with file storage (`/resources/new`),
      and a safe download counter via a `security definer` function
      rather than a broad table-wide update policy.
- [x] Campus events: browse upcoming events by category, save/
      bookmark, event detail page, and an "add event" form
      (`/events`, `/events/new`).
- [x] Admin moderation queue extended to all six listing types
      (products, hostels, vendors, services, resources, events)
      through one generic approve/reject action, plus a consolidated
      "Pending approvals" count on the dashboard.
- [x] Reporting: a "Report this listing" control on products,
      hostels, services, and vendors, writing to the `reports` table,
      plus an admin reports queue (`/admin/reports`) to dismiss or
      resolve them.
- [x] Route protection extended to `/messages`, `/notifications`,
      `/resources/new`, `/events/new`.

## Fixes made after the initial Phase 1–3 pass

A deployment-readiness review surfaced a few real gaps, now fixed:

- **Storage RLS was missing entirely.** Table-level RLS and Storage
  RLS are separate systems in Supabase — `schema.sql` covered the
  former but not the latter, so every upload (`marketplace/new`,
  `hostels/new`, `resources/new`) would have failed with a permission
  error against a real project. Fixed in
  `supabase/migrations/003_storage_policies.sql`.
- **"Report this listing" was a dead button** with no `onClick` and
  no indication it did nothing. It's now a working `ReportButton`
  component wired into products, hostels, gigs, and food vendors,
  backed by a real admin queue at `/admin/reports`.

## Storage buckets

In Supabase Storage, create (all public read):

- `product-images` — marketplace listing photos
- `hostel-images` — hostel listing photos
- `resources` — uploaded notes/past papers/study guides

`vendor-images` and menu item photos aren't needed yet — the food
section currently stores plain image URLs rather than file uploads.

## Notes on security

- RLS is enabled on every table. Policies generally mean: public read
  for active/approved content, owner-only write, admin-only for
  approvals/role changes.
- `is_admin()` is a `security definer` SQL function used inside
  policies — it checks `user_roles`, not any client-supplied flag.
- Admin pages re-verify the admin role server-side on every request
  (`requireAdmin()`) — the middleware only checks "is logged in",
  never "is admin".
- The service-role key is never imported by anything that ships to
  the browser.
