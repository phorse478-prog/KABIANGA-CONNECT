import type { SupabaseClient } from "@supabase/supabase-js";

// Fire-and-forget: notification failures should never block the
// action that triggered them (sending a message, updating an order,
// approving a listing).
export async function notify(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body?: string,
  link?: string
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      body,
      link,
    });
  } catch {
    // best-effort — see note above
  }
}
