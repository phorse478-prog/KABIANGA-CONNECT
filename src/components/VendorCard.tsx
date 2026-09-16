import Link from "next/link";
import { Truck, Clock } from "lucide-react";
import type { VendorListing } from "@/lib/types";

export function VendorCard({ vendor }: { vendor: VendorListing }) {
  return (
    <Link
      href={`/food/${vendor.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-card transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-lg font-semibold text-gray-400">
          {vendor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.logo_url}
              alt={vendor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            vendor.name[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {vendor.name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {vendor.location ?? "Near campus"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        {vendor.offers_delivery ? (
          <span className="flex items-center gap-1 text-brand-700">
            <Truck className="h-3.5 w-3.5" /> Delivers
          </span>
        ) : (
          <span className="flex items-center gap-1">Pickup only</span>
        )}
        {vendor.avg_prep_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> ~{vendor.avg_prep_minutes} min
          </span>
        )}
      </div>
    </Link>
  );
}
