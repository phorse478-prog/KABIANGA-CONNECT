import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Users,
  Package,
  ShoppingCart,
  ShieldAlert,
  Clock,
} from "lucide-react";

// Never trust a client-side flag for this — re-check the role
// against the database on every request.
async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) redirect("/");

  return supabase;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await requireAdmin();

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingProducts },
    { count: pendingHostels },
    { count: pendingVendors },
    { count: pendingServices },
    { count: pendingResources },
    { count: pendingEvents },
    { count: openReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("hostels")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const pendingApprovals =
    (pendingProducts ?? 0) +
    (pendingHostels ?? 0) +
    (pendingVendors ?? 0) +
    (pendingServices ?? 0) +
    (pendingResources ?? 0) +
    (pendingEvents ?? 0);

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, is_verified, is_suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Admin dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Platform overview and moderation queue.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Users} label="Total users" value={totalUsers ?? 0} />
        <StatCard
          icon={Package}
          label="Total listings"
          value={totalProducts ?? 0}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total orders"
          value={totalOrders ?? 0}
        />
        <StatCard
          icon={Clock}
          label="Pending approvals"
          value={pendingApprovals}
        />
        <StatCard
          icon={ShieldAlert}
          label="Open reports"
          value={openReports ?? 0}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/listings"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Review pending listings
        </Link>
        <Link
          href="/admin/users"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Manage users
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Review reports
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Recently joined
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Verified</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsers && recentUsers.length > 0 ? (
                recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5 text-gray-900">
                      {u.full_name}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.is_verified ? (
                        <span className="text-brand-700">Verified</span>
                      ) : (
                        <span className="text-gray-400">Not verified</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.is_suspended ? (
                        <span className="text-red-600">Suspended</span>
                      ) : (
                        <span className="text-gray-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("en-KE")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
