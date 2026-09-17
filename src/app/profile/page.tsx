import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ClipboardList, MessageCircle, Bell, BookOpen, CalendarDays, ChevronRight } from "lucide-react";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, bio, avatar_url, registration_number, course, campus_year, is_verified, created_at")
    .eq("id", user.id)
    .single();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name ?? "Student"} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
            {profile?.full_name?.[0]?.toUpperCase() ?? "S"}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {profile?.full_name ?? "Student"}
          </p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {roles && roles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.map((r) => (
            <span
              key={r.role}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600"
            >
              {r.role.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ProfileEditor profile={profile ?? null} />
      </div>

      <div className="mt-8 space-y-1 md:hidden">
        {[
          { href: "/messages", label: "Messages", icon: MessageCircle },
          { href: "/notifications", label: "Notifications", icon: Bell },
          { href: "/resources", label: "Resources", icon: BookOpen },
          { href: "/events", label: "Events", icon: CalendarDays },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-gray-800">
              <Icon className="h-4 w-4 text-gray-500" /> {label}
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          My transactions
        </h2>
        <EmptyState
          icon={ClipboardList}
          title="No transactions yet"
          description="Orders and payments you make on Kabianga Connect will show up here."
        />
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
