import Link from "next/link";
import Image from "next/image";
import { MapPin, Wifi, Droplet, Zap, Shield } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { StarRating } from "@/components/StarRating";
import type { HostelListing } from "@/lib/types";

export function HostelCard({ hostel }: { hostel: HostelListing }) {
  return (
    <Link
      href={`/hostels/${hostel.id}`}
      className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition hover:shadow-md"
    >
      <div className="relative h-36 w-full bg-gray-100">
        {hostel.cover_image_url ? (
          <Image
            src={hostel.cover_image_url}
            alt={hostel.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-gray-400">
            No photo yet
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-sm font-medium text-gray-900">
          {hostel.name}
        </p>
        <p className="text-sm font-semibold text-brand-700">
          {formatKES(hostel.price_per_month)}
          <span className="font-normal text-gray-400">/mo</span>
        </p>
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          {hostel.location}
          {hostel.distance_from_campus_km != null &&
            ` · ${hostel.distance_from_campus_km}km from campus`}
        </p>
        <div className="flex gap-2 pt-0.5 text-gray-400">
          {hostel.has_wifi && <Wifi className="h-3.5 w-3.5" />}
          {hostel.has_water && <Droplet className="h-3.5 w-3.5" />}
          {hostel.has_electricity && <Zap className="h-3.5 w-3.5" />}
          {hostel.has_security && <Shield className="h-3.5 w-3.5" />}
        </div>
        <StarRating value={hostel.rating ?? null} />
      </div>
    </Link>
  );
}
