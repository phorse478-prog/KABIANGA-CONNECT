import Link from "next/link";
import { Search } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuickActions } from "@/components/QuickActions";
import { Section } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { formatKES } from "@/lib/utils";
import type { ProductListing } from "@/lib/types";
import { ShoppingBag, Home as HomeIcon, Briefcase, UtensilsCrossed } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "Student";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) firstName = profile.full_name.split(" ")[0];
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, title, price_kes, location, status, created_at, seller_id, is_featured"
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: hostels } = await supabase
    .from("hostels")
    .select("id, name, price_per_month, location, room_type")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .limit(4);

  const { data: services } = await supabase
    .from("services")
    .select("id, title, category, starting_price_kes")
    .eq("status", "active")
    .limit(4);

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, location, offers_delivery")
    .eq("status", "active")
    .limit(4);

  const trending: ProductListing[] = (products ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    price_kes: Number(p.price_kes),
    location: p.location,
    status: p.status,
    created_at: p.created_at,
    seller_id: p.seller_id,
  }));

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-xl font-semibold text-gray-900">
          Hello, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500">
          What&apos;s happening around Kabianga?
        </p>
      </div>

      <form action="/marketplace" className="relative mt-4 block md:hidden">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          name="q"
          placeholder="Search products, hostels, food, gigs..."
          aria-label="Search marketplace"
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </form>

      <div className="mt-5">
        <QuickActions />
      </div>

      <Section title="Trending near you" viewAllHref="/marketplace">
        {trending.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No listings yet"
            description="Once students start listing products, they'll show up here."
            action={
              <Link
                href="/marketplace/new"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Create the first listing
              </Link>
            }
          />
        )}
      </Section>

      <Section title="Popular hostels" viewAllHref="/hostels">
        {hostels && hostels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hostels.map((h) => (
              <Link
                key={h.id}
                href={`/hostels/${h.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-md"
              >
                <p className="line-clamp-1 text-sm font-medium text-gray-900">
                  {h.name}
                </p>
                <p className="text-sm font-semibold text-brand-700">
                  {formatKES(Number(h.price_per_month))}/mo
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                  {h.location}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HomeIcon}
            title="No hostel listings yet"
            description="Hostel owners can add their first listing from the owner dashboard."
          />
        )}
      </Section>

      <Section title="Student services" viewAllHref="/gigs">
        {services && services.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/gigs/${s.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-md"
              >
                <p className="line-clamp-1 text-sm font-medium text-gray-900">
                  {s.title}
                </p>
                <p className="text-xs text-gray-500">{s.category}</p>
                {s.starting_price_kes && (
                  <p className="mt-1 text-sm font-semibold text-brand-700">
                    from {formatKES(Number(s.starting_price_kes))}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No services listed yet"
            description="Offering tutoring, design, printing or delivery? Be the first to post a gig."
          />
        )}
      </Section>

      <Section title="Food near campus" viewAllHref="/food">
        {vendors && vendors.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vendors.map((v) => (
              <Link
                key={v.id}
                href={`/food/${v.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-md"
              >
                <p className="line-clamp-1 text-sm font-medium text-gray-900">
                  {v.name}
                </p>
                <p className="text-xs text-gray-500">{v.location}</p>
                <p className="mt-1 text-xs text-brand-700">
                  {v.offers_delivery ? "Delivers" : "Pickup only"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title="No food vendors yet"
            description="Vendors can register from the vendor dashboard once approved by an admin."
          />
        )}
      </Section>

      <Section title="Campus updates">
        <EmptyState
          title="No announcements yet"
          description="Official campus updates and events will appear here once posted."
        />
      </Section>
    </div>
  );
}
