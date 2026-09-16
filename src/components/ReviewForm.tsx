"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/lib/utils";

type Target = "hostel" | "seller" | "service" | "vendor";

export function ReviewForm({
  targetType,
  targetId,
}: {
  targetType: Target;
  targetId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in to leave a review.");
      setSubmitting(false);
      return;
    }

    const table = targetType === "hostel" ? "hostel_reviews" : "reviews";
    const payload =
      targetType === "hostel"
        ? { hostel_id: targetId, reviewer_id: user.id, rating, comment }
        : { target_type: targetType, target_id: targetId, reviewer_id: user.id, rating, comment };

    const { error: insertError } = await (supabase.from(table) as any).insert(
      payload
    );

    setSubmitting(false);

    if (insertError) {
      setError(
        insertError.message.includes("duplicate")
          ? "You've already reviewed this."
          : insertError.message
      );
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
        Thanks — your review has been posted.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-4"
    >
      <p className="mb-2 text-sm font-medium text-gray-900">Leave a review</p>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            type="button"
            key={i}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={cx(
                "h-6 w-6 transition",
                i <= (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Share a bit about your experience..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
