import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKES, timeAgo } from "@/lib/utils";

const FOOD_STEPS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/orders/${params.id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_type, status, subtotal_kes, delivery_fee_kes, total_kes, delivery_address, notes, created_at, buyer_id, vendor_id"
    )
    .eq("id", params.id)
    .single();

  if (!order || order.buyer_id !== user.id) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price_kes, line_total_kes, menu_item_id, product_id")
    .eq("order_id", order.id);

  let vendorName: string | null = null;
  if (order.vendor_id) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("name")
      .eq("id", order.vendor_id)
      .single();
    vendorName = vendor?.name ?? null;
  }

  const menuItemIds = (items ?? [])
    .map((i) => i.menu_item_id)
    .filter((id): id is string => !!id);
  const { data: menuItemNames } =
    menuItemIds.length > 0
      ? await supabase
          .from("menu_items")
          .select("id, name")
          .in("id", menuItemIds)
      : { data: [] as { id: string; name: string }[] };

  const nameFor = (id: string | null) =>
    menuItemNames?.find((m) => m.id === id)?.name ?? "Item";

  const currentStepIndex = FOOD_STEPS.indexOf(
    order.status as (typeof FOOD_STEPS)[number]
  );

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to orders
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          {vendorName ?? "Order"}
        </h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-xs text-gray-500">
        Placed {timeAgo(order.created_at)}
      </p>

      {order.order_type === "food" &&
        order.status !== "cancelled" && (
          <div className="mt-5 flex items-center justify-between">
            {FOOD_STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div
                  className={`h-2 w-full ${
                    i <= currentStepIndex ? "bg-brand-600" : "bg-gray-200"
                  } ${i === 0 ? "rounded-l-full" : ""} ${
                    i === FOOD_STEPS.length - 1 ? "rounded-r-full" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        )}

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4">
        {items && items.length > 0 && (
          <div className="space-y-1.5 border-b border-gray-100 pb-3">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-700">
                <span>
                  {it.quantity} × {nameFor(it.menu_item_id)}
                </span>
                <span>{formatKES(Number(it.line_total_kes))}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatKES(Number(order.subtotal_kes))}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery fee</span>
            <span>{formatKES(Number(order.delivery_fee_kes))}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatKES(Number(order.total_kes))}</span>
          </div>
        </div>
        {order.delivery_address && (
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
            Delivering to: {order.delivery_address}
          </p>
        )}
        {order.notes && (
          <p className="mt-1 text-xs italic text-gray-400">
            &ldquo;{order.notes}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
