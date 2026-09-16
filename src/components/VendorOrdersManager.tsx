"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatKES, timeAgo } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { notify } from "@/lib/notifications";
import type { OrderStatus } from "@/lib/types";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Accept order",
  accepted: "Start preparing",
  preparing: "Mark ready",
  ready: "Send out for delivery",
  out_for_delivery: "Mark delivered",
};

interface VendorOrder {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  total_kes: number;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_NOTIFICATION_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: "Your order was accepted",
  preparing: "Your order is being prepared",
  ready: "Your order is ready",
  out_for_delivery: "Your order is out for delivery",
  delivered: "Your order was delivered",
  cancelled: "Your order was cancelled",
};

export function VendorOrdersManager({
  initialOrders,
}: {
  initialOrders: VendorOrder[];
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState(initialOrders);

  async function updateStatus(id: string, next: OrderStatus) {
    const order = orders.find((o) => o.id === id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    );
    await supabase.from("orders").update({ status: next }).eq("id", id);
    if (order && STATUS_NOTIFICATION_LABEL[next]) {
      notify(
        supabase,
        order.buyer_id,
        STATUS_NOTIFICATION_LABEL[next]!,
        undefined,
        `/orders/${id}`
      );
    }
  }

  async function advance(id: string, current: OrderStatus) {
    const next = NEXT_STATUS[current];
    if (!next) return;
    updateStatus(id, next);
  }

  async function cancel(id: string) {
    updateStatus(id, "cancelled");
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-400">
        No orders yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-gray-100 bg-white p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatKES(o.total_kes)}
              </p>
              <p className="text-xs text-gray-500">
                {o.delivery_address ?? "Pickup"} · {timeAgo(o.created_at)}
              </p>
              {o.notes && (
                <p className="mt-1 text-xs italic text-gray-400">
                  &ldquo;{o.notes}&rdquo;
                </p>
              )}
            </div>
            <StatusBadge status={o.status} />
          </div>

          {o.status !== "delivered" && o.status !== "cancelled" && (
            <div className="mt-2 flex gap-2">
              {NEXT_STATUS[o.status] && (
                <button
                  onClick={() => advance(o.id, o.status)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  {NEXT_LABEL[o.status]}
                </button>
              )}
              <button
                onClick={() => cancel(o.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
