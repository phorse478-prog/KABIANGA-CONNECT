"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

const ROOM_TYPES = [
  { value: "single", label: "Single" },
  { value: "shared", label: "Shared" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "one_bedroom", label: "1 Bedroom" },
];

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "water", label: "Water" },
  { key: "electricity", label: "Electricity" },
  { key: "security", label: "Security" },
];

export function HostelFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else if (params.get(key) === value) {
      params.delete(key); // toggle off
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Max price / month
        </p>
        <div className="flex flex-wrap gap-2">
          {["5000", "8000", "12000", "20000"].map((p) => (
            <button
              key={p}
              onClick={() => updateParam("maxPrice", p)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs",
                searchParams.get("maxPrice") === p
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              Under KSh {Number(p).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Room type
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => updateParam("roomType", rt.value)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs",
                searchParams.get("roomType") === rt.value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Gender preference
        </p>
        <div className="flex flex-wrap gap-2">
          {["male", "female", "mixed"].map((g) => (
            <button
              key={g}
              onClick={() => updateParam("gender", g)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs capitalize",
                searchParams.get("gender") === g
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Amenities
        </p>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              key={a.key}
              onClick={() => updateParam(a.key, "1")}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs",
                searchParams.get(a.key) === "1"
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {searchParams.toString() && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-medium text-gray-500 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
