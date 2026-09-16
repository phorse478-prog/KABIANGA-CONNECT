import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/ChatThread";

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/messages/${params.id}`);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", params.id)
    .single();

  if (
    !conversation ||
    (conversation.participant_one !== user.id &&
      conversation.participant_two !== user.id)
  ) {
    notFound();
  }

  const otherUserId =
    conversation.participant_one === user.id
      ? conversation.participant_two
      : conversation.participant_one;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", otherUserId)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/messages"
        className="mb-3 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        ← All conversations
      </Link>
      <ChatThread
        conversationId={conversation.id}
        currentUserId={user.id}
        otherUserId={otherUserId}
        otherUserName={otherProfile?.full_name ?? "Student"}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
