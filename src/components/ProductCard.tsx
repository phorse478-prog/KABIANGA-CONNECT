import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Star } from "lucide-react";
import { formatKES, timeAgo } from "@/lib/utils";
import type { ProductListing } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListing }) {
  return (
    <Link
      href={`/marketplace/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition hover:shadow-md"
    >
      <div className="relative h-36 w-full bg-gray-100">
        {product.cover_image_url ? (
          <Image
            src={product.cover_image_url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-gray-400">
            No image yet
          </div>
        )}
        <button
          type="button"
          aria-label="Save to favorites"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-gray-500 shadow-sm hover:text-rose-500"
        >
          <Heart
            className="h-4 w-4"
            fill={product.is_favorited ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-medium text-gray-900">
          {product.title}
        </p>
        <p className="text-sm font-semibold text-brand-700">
          {formatKES(product.price_kes)}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {product.location ?? "Kabianga"}
          </span>
          <span>{timeAgo(product.created_at)}</span>
        </div>
        {product.seller_name && (
          <div className="flex items-center gap-1 pt-1 text-xs text-gray-500">
            <span className="line-clamp-1">{product.seller_name}</span>
            {typeof product.seller_rating === "number" && (
              <span className="ml-auto flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {product.seller_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
