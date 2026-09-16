import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { MarkAllReadButton } from "@/components/MarkAllReadButton";
import { timeAgo, cx } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/notifications");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.is_read);

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
        {hasUnread && <MarkAllReadButton userId={user.id} />}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "/notifications"}
              className={cx(
                "block rounded-xl px-3 py-2.5 hover:bg-gray-50",
                !n.is_read && "bg-brand-50/60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                      {n.body}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {timeAgo(n.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Order updates, new messages, and service requests will show up here."
        />
      )}
    </div>
  );
}
