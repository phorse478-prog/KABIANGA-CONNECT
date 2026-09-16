import { notFound } from "next/navigation";
import { MapPin, Truck, Clock } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { VendorMenuCart } from "@/components/VendorMenuCart";
import { ReportButton } from "@/components/ReportButton";
import { StartConversationButton } from "@/components/StartConversationButton";
import type { MenuItemListing } from "@/lib/types";

export default async function VendorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "id, owner_id, name, description, location, offers_delivery, avg_prep_minutes"
    )
    .eq("id", params.id)
    .single();

  if (!vendor) notFound();

  const { data: menuItemsRaw } = await supabase
    .from("menu_items")
    .select("id, vendor_id, name, description, price_kes, image_url, is_available")
    .eq("vendor_id", vendor.id)
    .order("created_at");

  const menuItems: MenuItemListing[] = (menuItemsRaw ?? []).map((m) => ({
    ...m,
    price_kes: Number(m.price_kes),
  }));

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("target_type", "vendor")
    .eq("target_id", vendor.id)
    .order("created_at", { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const { data: commissionSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "vendor_commission_rate_percent")
    .single();

  const commissionPercent = Number(commissionSetting?.value ?? 10);

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{vendor.name}</h1>
        {vendor.description && (
          <p className="mt-1 text-sm text-gray-600">{vendor.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {vendor.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {vendor.location}
            </span>
          )}
          {vendor.offers_delivery && (
            <span className="flex items-center gap-1 text-brand-700">
              <Truck className="h-3.5 w-3.5" /> Delivers
            </span>
          )}
          {vendor.avg_prep_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> ~{vendor.avg_prep_minutes} min
            </span>
          )}
          <StarRating value={avgRating} count={reviews?.length} />
        </div>
        <div className="mt-3">
          <StartConversationButton
            otherUserId={vendor.owner_id}
            contextType="vendor"
            contextId={vendor.id}
            label="Message vendor"
            className="rounded-full border border-brand-600 px-4 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          />
        </div>
      </div>

      <div className="mt-6">
        <VendorMenuCart
          vendor={vendor}
          menuItems={menuItems}
          vendorCommissionPercent={commissionPercent}
        />
      </div>

      <div className="mt-8 max-w-lg">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
        </h2>
        <div className="mb-4">
          <ReviewForm targetType="vendor" targetId={vendor.id} />
        </div>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-3"
              >
                <StarRating value={r.rating} />
                {r.comment && (
                  <p className="mt-1.5 text-sm text-gray-700">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No reviews yet.</p>
        )}
      </div>

      <ReportButton targetType="vendor" targetId={vendor.id} />
    </div>
  );
}
