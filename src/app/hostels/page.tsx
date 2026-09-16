import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HostelFilterBar } from "@/components/HostelFilterBar";
import { HostelCard } from "@/components/HostelCard";
import { EmptyState } from "@/components/EmptyState";
import { Home as HomeIcon } from "lucide-react";
import type { HostelListing } from "@/lib/types";

export const revalidate = 30;

export default async function HostelsPage({
  searchParams,
}: {
  searchParams: {
    maxPrice?: string;
    roomType?: string;
    gender?: string;
    wifi?: string;
    water?: string;
    electricity?: string;
    security?: string;
  };
}) {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("hostels")
    .select(
      "id, name, price_per_month, location, distance_from_campus_km, room_type, gender_preference, has_wifi, has_water, has_electricity, has_security, created_at"
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams.maxPrice) {
    query = query.lte("price_per_month", Number(searchParams.maxPrice));
  }
  if (searchParams.roomType) {
    query = query.eq("room_type", searchParams.roomType);
  }
  if (searchParams.gender) {
    query = query.eq("gender_preference", searchParams.gender);
  }
  if (searchParams.wifi === "1") query = query.eq("has_wifi", true);
  if (searchParams.water === "1") query = query.eq("has_water", true);
  if (searchParams.electricity === "1")
    query = query.eq("has_electricity", true);
  if (searchParams.security === "1") query = query.eq("has_security", true);

  const { data: hostels } = await query;

  const listings: HostelListing[] = (hostels ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    price_per_month: Number(h.price_per_month),
    location: h.location,
    distance_from_campus_km: h.distance_from_campus_km,
    room_type: h.room_type,
    gender_preference: h.gender_preference,
    has_wifi: h.has_wifi,
    has_water: h.has_water,
    has_electricity: h.has_electricity,
    has_security: h.has_security,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Find a hostel
          </h1>
          <p className="text-sm text-gray-500">
            {listings.length} place{listings.length === 1 ? "" : "s"} near
            Kabianga
          </p>
        </div>
        <Link
          href="/hostels/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> List a hostel
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Suspense fallback={null}>
          <HostelFilterBar />
        </Suspense>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listings.map((h) => (
              <HostelCard key={h.id} hostel={h} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HomeIcon}
            title="No hostels match those filters"
            description="Try clearing a filter, or check back soon — new listings are added regularly."
          />
        )}
      </div>
    </div>
  );
}
