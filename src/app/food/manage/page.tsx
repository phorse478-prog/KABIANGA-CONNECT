import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { MenuItemManager } from "@/components/MenuItemManager";
import { VendorOrdersManager } from "@/components/VendorOrdersManager";
import { StatusBadge } from "@/components/StatusBadge";
import type { MenuItemListing } from "@/lib/types";

export default async function VendorManagePage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/food/manage");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!vendor) {
    return (
      <div>
        <h1 className="mb-4 text-lg font-semibold text-gray-900">
          Vendor dashboard
        </h1>
        <VendorProfileForm />
      </div>
    );
  }

  const { data: menuItemsRaw } = await supabase
    .from("menu_items")
    .select("id, vendor_id, name, description, price_kes, image_url, is_available")
    .eq("vendor_id", vendor.id)
    .order("created_at");

  const menuItems: MenuItemListing[] = (menuItemsRaw ?? []).map((m) => ({
    ...m,
    price_kes: Number(m.price_kes),
  }));

  const { data: ordersRaw } = await supabase
    .from("orders")
    .select(
      "id, buyer_id, status, total_kes, delivery_address, notes, created_at"
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const orders = (ordersRaw ?? []).map((o) => ({
    ...o,
    total_kes: Number(o.total_kes),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{vendor.name}</h1>
        <StatusBadge status={vendor.status} />
      </div>

      {vendor.status === "pending" && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your vendor profile is awaiting admin approval. You can still add
          menu items in the meantime.
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Menu items
        </h2>
        <MenuItemManager vendorId={vendor.id} initialItems={menuItems} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Incoming orders
        </h2>
        <VendorOrdersManager initialOrders={orders} />
      </section>
    </div>
  );
}
