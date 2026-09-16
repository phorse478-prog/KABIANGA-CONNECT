import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatKES, timeAgo } from "@/lib/utils";
import { ComingSoon } from "@/components/ComingSoon";
import { StartConversationButton } from "@/components/StartConversationButton";
import { ReportButton } from "@/components/ReportButton";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, title, description, price_kes, location, condition, created_at, seller_id, status"
    )
    .eq("id", params.id)
    .single();

  if (!product) notFound();

  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", product.id)
    .order("sort_order");

  const { data: seller } = await supabase
    .from("profiles")
    .select("full_name, is_verified")
    .eq("id", product.seller_id)
    .single();

  const cover = images?.[0]?.storage_path ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-96">
        {cover ? (
          <Image src={cover} alt={product.title} fill className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-gray-400">
            No photos uploaded yet
          </div>
        )}
      </div>

      {images && images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100"
            >
              <Image
                src={img.storage_path}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {product.title}
          </h1>
          <p className="mt-1 text-xl font-bold text-brand-700">
            {formatKES(Number(product.price_kes))}
          </p>
        </div>
        {product.condition && (
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
            {product.condition}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" /> {product.location ?? "Kabianga"}
        </span>
        <span>{timeAgo(product.created_at)}</span>
      </div>

      {product.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {product.description}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-sm font-medium text-gray-900">
          {seller?.full_name ?? "Seller"}
          {seller?.is_verified && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              Verified
            </span>
          )}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>No ratings yet</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StartConversationButton
          otherUserId={product.seller_id}
          contextType="product"
          contextId={product.id}
          label="Chat seller"
        />
        <button className="rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Buy now
        </button>
      </div>

      <div className="mt-3">
        <ComingSoon label="In-app checkout" />
      </div>

      <ReportButton targetType="product" targetId={product.id} />
    </div>
  );
}
