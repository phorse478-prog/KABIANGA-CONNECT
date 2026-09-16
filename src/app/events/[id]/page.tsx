import { notFound } from "next/navigation";
import { CalendarDays, MapPin, User } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SaveEventButton } from "@/components/SaveEventButton";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, category, image_url, location, starts_at, ends_at, organizer_id"
    )
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let saved = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("target_type", "event")
      .eq("target_id", event.id)
      .maybeSingle();
    saved = !!fav;
  }

  let organizerName: string | null = null;
  if (event.organizer_id) {
    const { data: organizer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", event.organizer_id)
      .single();
    organizerName = organizer?.full_name ?? null;
  }

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;

  return (
    <div className="mx-auto max-w-xl">
      {event.category && (
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
          {event.category}
        </p>
      )}
      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">{event.title}</h1>
        <SaveEventButton eventId={event.id} initiallySaved={saved} />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          {start.toLocaleString("en-KE", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          })}
          {end &&
            ` – ${end.toLocaleString("en-KE", {
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </p>
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" /> {event.location}
          </p>
        )}
        {organizerName && (
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" /> Organized by{" "}
            {organizerName}
          </p>
        )}
      </div>

      {event.description && (
        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {event.description}
        </p>
      )}
    </div>
  );
}
