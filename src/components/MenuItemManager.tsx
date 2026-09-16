"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatKES } from "@/lib/utils";
import type { MenuItemListing } from "@/lib/types";

export function MenuItemManager({
  vendorId,
  initialItems,
}: {
  vendorId: string;
  initialItems: MenuItemListing[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("menu_items")
      .insert({
        vendor_id: vendorId,
        name,
        description,
        price_kes: Number(price),
        is_available: true,
      })
      .select("id, vendor_id, name, description, price_kes, image_url, is_available")
      .single();

    setSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not add item.");
      return;
    }

    setItems((prev) => [...prev, { ...data, price_kes: Number(data.price_kes) }]);
    setName("");
    setPrice("");
    setDescription("");
    router.refresh();
  }

  async function toggleAvailability(id: string, current: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: !current } : i))
    );
    await supabase
      .from("menu_items")
      .update({ is_available: !current })
      .eq("id", id);
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("menu_items").delete().eq("id", id);
  }

  return (
    <div>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No menu items yet.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {item.name}
              </p>
              <p className="text-sm text-brand-700">
                {formatKES(item.price_kes)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleAvailability(item.id, item.is_available)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.is_available
                    ? "bg-brand-50 text-brand-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </button>
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={addItem}
        className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-dashed border-gray-200 p-3 sm:grid-cols-[2fr_1fr_auto]"
      >
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <input
          required
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (KES)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Add
        </button>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:col-span-3"
        />
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
