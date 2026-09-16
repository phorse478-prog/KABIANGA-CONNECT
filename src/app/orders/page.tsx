import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKES, timeAgo } from "@/lib/utils";

export default async function OrdersPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_type, status, total_kes, created_at, vendor_id")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">My orders</h1>

      {orders && orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-medium capitalize text-gray-900">
                  {o.order_type} order
                </p>
                <p className="text-xs text-gray-500">
                  {formatKES(Number(o.total_kes))} · {timeAgo(o.created_at)}
                </p>
              </div>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Orders you place for food or products will show up here."
        />
      )}
    </div>
  );
}
