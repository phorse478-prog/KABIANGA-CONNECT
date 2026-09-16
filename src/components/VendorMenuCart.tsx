"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatKES } from "@/lib/utils";
import type { CartLine, MenuItemListing, VendorListing } from "@/lib/types";

const FLAT_DELIVERY_FEE_KES = 100;

export function VendorMenuCart({
  vendor,
  menuItems,
  vendorCommissionPercent,
}: {
  vendor: VendorListing;
  menuItems: MenuItemListing[];
  vendorCommissionPercent: number;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [wantsDelivery, setWantsDelivery] = useState(vendor.offers_delivery);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQty(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] ?? 0) + delta;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = menuItems.find((m) => m.id === id);
          if (!item) return null;
          return {
            menuItemId: id,
            name: item.name,
            unitPriceKes: item.price_kes,
            quantity,
          };
        })
        .filter((l): l is CartLine => l !== null),
    [cart, menuItems]
  );

  const subtotal = lines.reduce(
    (sum, l) => sum + l.unitPriceKes * l.quantity,
    0
  );
  const deliveryFee = wantsDelivery && subtotal > 0 ? FLAT_DELIVERY_FEE_KES : 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    setError(null);

    if (lines.length === 0) {
      setError("Add at least one item to your cart.");
      return;
    }
    if (wantsDelivery && !address.trim()) {
      setError("Add a delivery address, or switch to pickup.");
      return;
    }

    setPlacing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in to place an order.");
      setPlacing(false);
      return;
    }

    const commission = Math.round((subtotal * vendorCommissionPercent) / 100);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        order_type: "food",
        vendor_id: vendor.id,
        status: "pending",
        subtotal_kes: subtotal,
        delivery_fee_kes: deliveryFee,
        commission_kes: commission,
        total_kes: total,
        delivery_address: wantsDelivery ? address : "Pickup at vendor",
        notes,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Could not place order. Try again.");
      setPlacing(false);
      return;
    }

    const orderItems = lines.map((l) => ({
      order_id: order.id,
      menu_item_id: l.menuItemId,
      quantity: l.quantity,
      unit_price_kes: l.unitPriceKes,
      line_total_kes: l.unitPriceKes * l.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    setPlacing(false);
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Menu</h2>
        {menuItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-400">
            This vendor hasn&apos;t added any menu items yet.
          </p>
        ) : (
          <div className="space-y-2">
            {menuItems.map((item) => {
              const qty = cart[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="line-clamp-1 text-xs text-gray-500">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-brand-700">
                      {formatKES(item.price_kes)}
                    </p>
                  </div>

                  {item.is_available ? (
                    qty > 0 ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="shrink-0 rounded-full border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Add
                      </button>
                    )
                  ) : (
                    <span className="shrink-0 text-xs text-gray-400">
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-fit rounded-2xl border border-gray-100 bg-white p-4 lg:sticky lg:top-20">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <ShoppingCart className="h-4 w-4" /> Your order
        </p>

        {lines.length === 0 ? (
          <p className="text-sm text-gray-400">Your cart is empty.</p>
        ) : (
          <div className="space-y-1.5">
            {lines.map((l) => (
              <div
                key={l.menuItemId}
                className="flex justify-between text-sm text-gray-700"
              >
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span>{formatKES(l.unitPriceKes * l.quantity)}</span>
              </div>
            ))}
          </div>
        )}

        {vendor.offers_delivery && (
          <div className="mt-3 flex gap-2 text-xs">
            <button
              onClick={() => setWantsDelivery(true)}
              className={`flex-1 rounded-lg border py-1.5 font-medium ${
                wantsDelivery
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setWantsDelivery(false)}
              className={`flex-1 rounded-lg border py-1.5 font-medium ${
                !wantsDelivery
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              Pickup
            </button>
          </div>
        )}

        {wantsDelivery && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery address / hostel + room"
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        )}

        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for the vendor (optional)"
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />

        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery fee</span>
            <span>{formatKES(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatKES(total)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={placeOrder}
          disabled={placing || lines.length === 0}
          className="mt-3 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </div>
  );
}
