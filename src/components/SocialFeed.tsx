"use client";

import { useMemo, useState } from "react";
import { Heart, MessageCircle, SendHorizonal, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SocialComment = {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
};

type SocialPost = {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
  course: string | null;
  campus_year: string | null;
  like_count: number;
  liked_by_me: boolean;
  comments: SocialComment[];
};

export function SocialFeed({ initialPosts }: { initialPosts: SocialPost[] }) {
  const supabase = createClient();
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalLikes = useMemo(
    () => posts.reduce((sum, post) => sum + post.like_count, 0),
    [posts]
  );

  async function handleCreatePost() {
    const text = draft.trim();
    if (!text) return;

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, body: text })
      .select("id, body, created_at, author_id")
      .single();

    setSaving(false);

    if (!error && data) {
      setPosts((current) => [
        {
          id: data.id,
          body: data.body,
          created_at: data.created_at,
          author_name: "You",
          author_avatar_url: null,
          course: null,
          campus_year: null,
          like_count: 0,
          liked_by_me: false,
          comments: [],
        },
        ...current,
      ]);
      setDraft("");
    }
  }

  async function handleLike(postId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (!error) {
        setPosts((current) =>
          current.map((item) =>
            item.id === postId
              ? { ...item, liked_by_me: false, like_count: Math.max(0, item.like_count - 1) }
              : item
          )
        );
      }
      return;
    }

    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });

    if (!error) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? { ...item, liked_by_me: true, like_count: item.like_count + 1 }
            : item
        )
      );
    }
  }

  async function handleComment(postId: string) {
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: user.id, body: text })
      .select("id, body, created_at, author_id")
      .single();

    if (!error && data) {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  {
                    id: data.id,
                    body: data.body,
                    created_at: data.created_at,
                    author_name: "You",
                  },
                ],
              }
            : post
        )
      );
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Campus feed</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Student posts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Share updates, ask for help, and connect with classmates across campus.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-600">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="What’s happening on campus today?"
            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{totalLikes} total likes</span>
          <button
            type="button"
            onClick={handleCreatePost}
            disabled={saving || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <SendHorizonal className="h-4 w-4" />
            {saving ? "Posting..." : "Post update"}
          </button>
        </div>
      </div>

      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
          <div className="flex items-start gap-3">
            {post.author_avatar_url ? (
              <img src={post.author_avatar_url} alt={post.author_name ?? "Student"} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {(post.author_name ?? "ST").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{post.author_name ?? "Student"}</p>
                  <p className="text-xs text-gray-500">
                    {post.course || "Student"}
                    {post.course && post.campus_year ? " • " : ""}
                    {post.campus_year ?? ""}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-700">{post.body}</p>

              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3 text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-gray-50"
                >
                  <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-red-500 text-red-500" : ""}`} />
                  {post.like_count}
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{comment.author_name ?? "Student"}:</span> {comment.body}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={commentDrafts[post.id] ?? ""}
                  onChange={(e) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [post.id]: e.target.value,
                    }))
                  }
                  placeholder="Write a comment..."
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => handleComment(post.id)}
                  className="rounded-full bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
