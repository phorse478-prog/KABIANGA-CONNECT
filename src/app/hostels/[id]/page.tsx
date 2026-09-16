import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Wifi, Droplet, Zap, Shield, Car } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatKES } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { ComingSoon } from "@/components/ComingSoon";
import { StartConversationButton } from "@/components/StartConversationButton";
import { ReportButton } from "@/components/ReportButton";

const AMENITY_ICONS = [
  { key: "has_wifi", label: "Wi-Fi", icon: Wifi },
  { key: "has_water", label: "Water", icon: Droplet },
  { key: "has_electricity", label: "Electricity", icon: Zap },
  { key: "has_security", label: "Security", icon: Shield },
  { key: "has_parking", label: "Parking", icon: Car },
] as const;

export default async function HostelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: hostel } = await supabase
    .from("hostels")
    .select(
      "id, name, description, price_per_month, location, distance_from_campus_km, room_type, occupancy, gender_preference, has_wifi, has_water, has_electricity, has_security, has_parking, owner_id, is_demo"
    )
    .eq("id", params.id)
    .single();

  if (!hostel) notFound();

  const { data: images } = await supabase
    .from("hostel_images")
    .select("storage_path")
    .eq("hostel_id", hostel.id)
    .order("sort_order");

  const { data: reviews } = await supabase
    .from("hostel_reviews")
    .select("rating, comment, created_at, reviewer_id")
    .eq("hostel_id", hostel.id)
    .order("created_at", { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-80">
        {images && images.length > 0 ? (
          <Image
            src={images[0].storage_path}
            alt={hostel.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-gray-400">
            No photos uploaded yet
          </div>
        )}
        {hostel.is_demo && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
            Demo listing
          </span>
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {hostel.name}
          </h1>
          <p className="mt-1 text-xl font-bold text-brand-700">
            {formatKES(Number(hostel.price_per_month))}
            <span className="text-sm font-normal text-gray-400">/month</span>
          </p>
        </div>
        {hostel.gender_preference && (
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
            {hostel.gender_preference}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {hostel.location}
          {hostel.distance_from_campus_km != null &&
            ` · ${hostel.distance_from_campus_km}km from campus`}
        </span>
        <StarRating value={avgRating} count={reviews?.length} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {AMENITY_ICONS.filter((a) => hostel[a.key]).map((a) => (
          <span
            key={a.key}
            className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600"
          >
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </span>
        ))}
        {hostel.room_type && (
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs capitalize text-gray-600">
            {hostel.room_type.replace("_", " ")}
          </span>
        )}
        {hostel.occupancy && (
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
            {hostel.occupancy} per room
          </span>
        )}
      </div>

      {hostel.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {hostel.description}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <StartConversationButton
          otherUserId={hostel.owner_id}
          contextType="hostel"
          contextId={hostel.id}
          label="Message owner"
        />
        <button className="rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Request viewing
        </button>
      </div>
      <div className="mt-3">
        <ComingSoon label="In-app booking" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
        </h2>

        <div className="mb-4">
          <ReviewForm targetType="hostel" targetId={hostel.id} />
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
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("en-KE")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No reviews yet — be the first to share your experience.
          </p>
        )}
      </div>

      <ReportButton targetType="hostel" targetId={hostel.id} />
    </div>
  );
}
