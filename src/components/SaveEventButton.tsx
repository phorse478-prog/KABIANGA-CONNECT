"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/lib/utils";

export function SaveEventButton({
  eventId,
  initiallySaved,
}: {
  eventId: string;
  initiallySaved: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirectTo=/events");
      return;
    }

    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "event")
        .eq("target_id", eventId);
      setSaved(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        target_type: "event",
        target_id: eventId,
      });
      setSaved(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cx(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium disabled:opacity-60",
        saved
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      )}
    >
      <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
