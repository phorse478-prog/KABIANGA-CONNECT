import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/utils";

export default async function MessagesPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two, context_type, created_at")
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const rows = await Promise.all(
    (conversations ?? []).map(async (c) => {
      const otherId =
        c.participant_one === user.id ? c.participant_two : c.participant_one;

      const [{ data: other }, { data: lastMessage }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", otherId)
          .single(),
        supabase
          .from("messages")
          .select("body, created_at, sender_id, is_read")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        id: c.id,
        otherName: other?.full_name ?? "Student",
        contextType: c.context_type,
        lastMessage: lastMessage?.body ?? null,
        lastAt: lastMessage?.created_at ?? c.created_at,
        unread: lastMessage
          ? !lastMessage.is_read && lastMessage.sender_id !== user.id
          : false,
      };
    })
  );

  rows.sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Messages</h1>

      {rows.length > 0 ? (
        <div className="space-y-1">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/messages/${r.id}`}
              className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-gray-50"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {r.otherName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {r.otherName}
                  </p>
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(r.lastAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-gray-500">
                  {r.lastMessage ?? "Say hello 👋"}
                </p>
              </div>
              {r.unread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Message a seller, hostel owner, or vendor from any listing to start a chat."
        />
      )}
    </div>
  );
}
