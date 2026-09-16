import Link from "next/link";
import { Plus, CalendarDays, MapPin } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { SaveEventButton } from "@/components/SaveEventButton";
import { cx } from "@/lib/utils";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/lib/types";

export const revalidate = 60;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("events")
    .select(
      "id, title, description, category, image_url, location, starts_at, ends_at"
    )
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data: events } = await query;

  let savedIds = new Set<string>();
  if (user && events && events.length > 0) {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "event")
      .in(
        "target_id",
        events.map((e) => e.id)
      );
    savedIds = new Set((favorites ?? []).map((f) => f.target_id));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Campus events
          </h1>
          <p className="text-sm text-gray-500">
            Clubs, sports, entertainment, and career events at Kabianga.
          </p>
        </div>
        <Link
          href="/events/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add event
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/events"
          className={cx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
            !searchParams.category
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-200 text-gray-600"
          )}
        >
          All
        </Link>
        {(Object.entries(EVENT_CATEGORY_LABELS) as [EventCategory, string][]).map(
          ([value, label]) => (
            <Link
              key={value}
              href={`/events?category=${value}`}
              className={cx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
                searchParams.category === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {label}
            </Link>
          )
        )}
      </div>

      <div className="mt-4">
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {events.map((e) => {
              const startDate = new Date(e.starts_at);
              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <span className="text-[10px] font-medium uppercase">
                      {startDate.toLocaleDateString("en-KE", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {startDate.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {e.title}
                    </p>
                    {e.location && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {e.location}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center justify-between">
                      {e.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-600">
                          {e.category}
                        </span>
                      )}
                      <SaveEventButton
                        eventId={e.id}
                        initiallySaved={savedIds.has(e.id)}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Running a club, sports fixture, or campus event? Add it here."
            action={
              <Link
                href="/events/new"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Add the first event
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
