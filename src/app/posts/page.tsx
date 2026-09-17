import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SocialFeed } from "@/components/SocialFeed";

export default async function PostsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: postsRows } = await supabase
    .from("posts")
    .select("id, body, created_at, author_id")
    .order("created_at", { ascending: false });

  const initialPosts = await Promise.all(
    (postsRows ?? []).map(async (post) => {
      const { data: author } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, course, campus_year")
        .eq("id", post.author_id)
        .single();

      const { data: likes } = await supabase
        .from("post_likes")
        .select("user_id", { count: "exact" })
        .eq("post_id", post.id);

      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("id, body, created_at, author_id")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      const comments = await Promise.all(
        (commentsData ?? []).map(async (comment) => {
          const { data: commentAuthor } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", comment.author_id)
            .single();

          return {
            id: comment.id,
            body: comment.body,
            created_at: comment.created_at,
            author_name: commentAuthor?.full_name ?? "Student",
          };
        })
      );

      const likedByMe = user
        ? !!(await supabase
            .from("post_likes")
            .select("user_id")
            .eq("post_id", post.id)
            .eq("user_id", user.id)
            .maybeSingle())
        : false;

      return {
        id: post.id,
        body: post.body,
        created_at: post.created_at,
        author_name: author?.full_name ?? "Student",
        author_avatar_url: author?.avatar_url ?? null,
        course: author?.course ?? null,
        campus_year: author?.campus_year ?? null,
        like_count: likes?.length ?? 0,
        liked_by_me: likedByMe,
        comments,
      };
    })
  );

  return <SocialFeed initialPosts={initialPosts} />;
}
