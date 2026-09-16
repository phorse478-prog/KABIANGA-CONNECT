import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatKES, cx } from "@/lib/utils";

const CATEGORIES = [
  "Graphic design",
  "Web development",
  "Photography",
  "Tutoring",
  "Typing",
  "CV writing",
  "Video editing",
  "Social media management",
  "Printing",
  "Delivery",
  "Other",
];

export const revalidate = 30;

export default async function GigsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("services")
    .select(
      "id, title, category, starting_price_kes, provider_id, created_at"
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams.category) query = query.eq("category", searchParams.category);
  if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);

  const { data: services } = await query;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Student gigs</h1>
        <Link
          href="/gigs/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Offer a service
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/gigs"
          className={cx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
            !searchParams.category
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-200 text-gray-600"
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/gigs?category=${encodeURIComponent(c)}`}
            className={cx(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
              searchParams.category === c
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-200 text-gray-600"
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/gigs/${s.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {s.category}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {s.title}
                </p>
                {s.starting_price_kes && (
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    from {formatKES(Number(s.starting_price_kes))}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No gigs found"
            description="Try a different category, or post the first service in this category."
            action={
              <Link
                href="/gigs/new"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Offer a service
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
