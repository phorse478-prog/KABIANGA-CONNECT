import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatKES } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { StartConversationButton } from "@/components/StartConversationButton";
import { ReportButton } from "@/components/ReportButton";

export default async function GigDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: service } = await supabase
    .from("services")
    .select(
      "id, title, category, description, starting_price_kes, provider_id, created_at"
    )
    .eq("id", params.id)
    .single();

  if (!service) notFound();

  const { data: provider } = await supabase
    .from("profiles")
    .select("full_name, is_verified")
    .eq("id", service.provider_id)
    .single();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("target_type", "service")
    .eq("target_id", service.id)
    .order("created_at", { ascending: false });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
        {service.category}
      </p>
      <h1 className="mt-1 text-lg font-semibold text-gray-900">
        {service.title}
      </h1>
      {service.starting_price_kes && (
        <p className="mt-1 text-xl font-bold text-brand-700">
          from {formatKES(Number(service.starting_price_kes))}
        </p>
      )}
      <div className="mt-1">
        <StarRating value={avgRating} count={reviews?.length} />
      </div>

      {service.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {service.description}
        </p>
      )}

      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-sm font-medium text-gray-900">
          {provider?.full_name ?? "Provider"}
          {provider?.is_verified && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              Verified
            </span>
          )}
        </p>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">
          Request this service
        </h2>
        <ServiceRequestForm serviceId={service.id} providerId={service.provider_id} />
        <div className="mt-2">
          <StartConversationButton
            otherUserId={service.provider_id}
            contextType="service"
            contextId={service.id}
            label="Message provider"
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
        </h2>
        <div className="mb-4">
          <ReviewForm targetType="service" targetId={service.id} />
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

      <ReportButton targetType="service" targetId={service.id} />
    </div>
  );
}
