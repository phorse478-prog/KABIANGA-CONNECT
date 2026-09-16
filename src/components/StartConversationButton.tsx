"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ContextType = "product" | "hostel" | "service" | "vendor" | "general";

export function StartConversationButton({
  otherUserId,
  contextType,
  contextId,
  label = "Message",
  className,
}: {
  otherUserId: string;
  contextType: ContextType;
  contextId?: string;
  label?: string;
  className?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirectTo=/messages");
      return;
    }

    if (user.id === otherUserId) {
      setLoading(false);
      return;
    }

    // Keep participant order deterministic so the unique constraint
    // on (participant_one, participant_two, context_type, context_id)
    // actually catches duplicates regardless of who starts the chat.
    const [participantOne, participantTwo] = [user.id, otherUserId].sort();

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_one", participantOne)
      .eq("participant_two", participantTwo)
      .eq("context_type", contextType)
      .eq("context_id", contextId ?? null)
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        participant_one: participantOne,
        participant_two: participantTwo,
        context_type: contextType,
        context_id: contextId ?? null,
      })
      .select("id")
      .single();

    setLoading(false);

    if (!error && created) {
      router.push(`/messages/${created.id}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "rounded-xl border border-brand-600 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
      }
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
