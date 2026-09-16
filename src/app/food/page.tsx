import Link from "next/link";
import { Plus, UtensilsCrossed } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VendorCard } from "@/components/VendorCard";
import { EmptyState } from "@/components/EmptyState";
import type { VendorListing } from "@/lib/types";

export const revalidate = 30;

export default async function FoodPage() {
  const supabase = createServerSupabaseClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select(
      "id, name, description, location, offers_delivery, avg_prep_minutes"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const listings: VendorListing[] = vendors ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Food near campus
          </h1>
          <p className="text-sm text-gray-500">
            Order from student-run kitchens and local vendors.
          </p>
        </div>
        <Link
          href="/food/manage"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Vendor dashboard
        </Link>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UtensilsCrossed}
          title="No food vendors yet"
          description="Run a kitchen or food stall on campus? Set up your vendor profile to start taking orders."
          action={
            <Link
              href="/food/manage"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Set up your vendor profile
            </Link>
          }
        />
      )}
    </div>
  );
}
