import Link from "next/link";
import { Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { cx } from "@/lib/utils";
import type { ProductListing } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

export const revalidate = 30;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  let query = supabase
    .from("products")
    .select(
      "id, title, price_kes, location, status, created_at, seller_id, category_id"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (searchParams.category) {
    const cat = categories?.find((c) => c.slug === searchParams.category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`);
  }

  const { data: products } = await query;

  const listings: ProductListing[] = (products ?? []).map((p) => ({
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Marketplace</h1>
        <Link
          href="/marketplace/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Sell something
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/marketplace"
          className={cx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
            !searchParams.category
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-200 text-gray-600"
          )}
        >
          All
        </Link>
        {categories?.map((c) => (
          <Link
            key={c.id}
            href={`/marketplace?category=${c.slug}`}
            className={cx(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
              searchParams.category === c.slug
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-200 text-gray-600"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No listings found"
            description="Try a different category, or be the first to list something here."
            action={
              <Link
                href="/marketplace/new"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Create a listing
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
