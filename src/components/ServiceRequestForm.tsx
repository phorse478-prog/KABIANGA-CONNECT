"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notifications";

export function ServiceRequestForm({
  serviceId,
  providerId,
}: {
  serviceId: string;
  providerId: string;
}) {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in to contact this provider.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("service_requests")
      .insert({ service_id: serviceId, requester_id: user.id, message });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    notify(
      supabase,
      providerId,
      "New service request",
      message.slice(0, 80),
      `/gigs/${serviceId}`
    );

    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
        Request sent — the provider will get back to you.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Tell them what you need, and by when..."
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
