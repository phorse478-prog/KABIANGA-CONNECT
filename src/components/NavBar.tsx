import Link from "next/link";
import { Bell, MessageCircle, Search, User } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/hostels", label: "Hostels" },
  { href: "/food", label: "Food" },
  { href: "/gigs", label: "Gigs" },
  { href: "/posts", label: "Posts" },
  { href: "/resources", label: "Resources" },
  { href: "/events", label: "Events" },
  { href: "/lost-found", label: "Lost & Found" },
];

export async function NavBar() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b border-gray-200 bg-white/90 backdrop-blur md:block">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            KC
          </span>
          <span className="text-sm font-semibold text-gray-900">
            Kabianga Connect
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <form
            action="/marketplace"
            className="relative hidden lg:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              placeholder="Search products, hostels, food, gigs..."
              aria-label="Search marketplace"
              className="w-72 rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </form>

          <Link
            href="/messages"
            aria-label="Messages"
            className="grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            aria-label="Profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
