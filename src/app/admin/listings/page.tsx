import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatKES } from "@/lib/utils";
import { PackageSearch } from "lucide-react";

const MODERATABLE_TABLES = [
  "products",
  "hostels",
  "vendors",
  "services",
  "resources",
  "events",
] as const;
type ModeratableTable = (typeof MODERATABLE_TABLES)[number];

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/listings");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) redirect("/");

  return supabase;
}

// One generic action for every moderatable table — the table name is
// checked against a fixed whitelist before touching the database, so
// this can't be abused to write to an arbitrary table.
async function moderateListing(formData: FormData) {
  "use server";
  const table = formData.get("table") as ModeratableTable;
  const id = formData.get("id") as string;
  const status = formData.get("status") as "active" | "rejected";
  const ownerId = formData.get("ownerId") as string | null;
  const itemLabel = formData.get("itemLabel") as string;

  if (!MODERATABLE_TABLES.includes(table)) return;

  const supabase = await requireAdmin();
  await (supabase.from(table) as any).update({ status }).eq("id", id);

  if (ownerId) {
    await supabase.from("notifications").insert({
      user_id: ownerId,
      title:
        status === "active"
          ? `Your listing was approved`
          : `Your listing was not approved`,
      body: itemLabel,
    });
  }

  revalidatePath("/admin/listings");
}

function ModerationRow({
  table,
  id,
  ownerId,
  itemLabel,
  title,
  subtitle,
}: {
  table: ModeratableTable;
  id: string;
  ownerId: string | null;
  itemLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{title}</p>
        <p className="truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <form action={moderateListing}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="rejected" />
          <input type="hidden" name="ownerId" value={ownerId ?? ""} />
          <input type="hidden" name="itemLabel" value={itemLabel} />
          <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Reject
          </button>
        </form>
        <form action={moderateListing}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="active" />
          <input type="hidden" name="ownerId" value={ownerId ?? ""} />
          <input type="hidden" name="itemLabel" value={itemLabel} />
          <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            Approve
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminListingsPage() {
  const supabase = await requireAdmin();

  const [
    { data: pendingProducts },
    { data: pendingHostels },
    { data: pendingVendors },
    { data: pendingServices },
    { data: pendingResources },
    { data: pendingEvents },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, price_kes, location, seller_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("hostels")
      .select("id, name, price_per_month, location, owner_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("vendors")
      .select("id, name, location, owner_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("services")
      .select("id, title, category, provider_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("resources")
      .select("id, title, course, unit, uploader_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("events")
      .select("id, title, location, starts_at, organizer_id, created_at")
      .eq("status", "pending")
      .order("created_at"),
  ]);

  const sections = [
    {
      key: "products" as ModeratableTable,
      label: "Products",
      rows: (pendingProducts ?? []).map((p) => ({
        id: p.id,
        ownerId: p.seller_id,
        itemLabel: p.title,
        title: p.title,
        subtitle: `${formatKES(Number(p.price_kes))} · ${p.location ?? "—"}`,
      })),
    },
    {
      key: "hostels" as ModeratableTable,
      label: "Hostels",
      rows: (pendingHostels ?? []).map((h) => ({
        id: h.id,
        ownerId: h.owner_id,
        itemLabel: h.name,
        title: h.name,
        subtitle: `${formatKES(Number(h.price_per_month))}/mo · ${h.location}`,
      })),
    },
    {
      key: "vendors" as ModeratableTable,
      label: "Food vendors",
      rows: (pendingVendors ?? []).map((v) => ({
        id: v.id,
        ownerId: v.owner_id,
        itemLabel: v.name,
        title: v.name,
        subtitle: v.location ?? "—",
      })),
    },
    {
      key: "services" as ModeratableTable,
      label: "Gigs / services",
      rows: (pendingServices ?? []).map((s) => ({
        id: s.id,
        ownerId: s.provider_id,
        itemLabel: s.title,
        title: s.title,
        subtitle: s.category,
      })),
    },
    {
      key: "resources" as ModeratableTable,
      label: "Academic resources",
      rows: (pendingResources ?? []).map((r) => ({
        id: r.id,
        ownerId: r.uploader_id,
        itemLabel: r.title,
        title: r.title,
        subtitle: [r.course, r.unit].filter(Boolean).join(" · ") || "—",
      })),
    },
    {
      key: "events" as ModeratableTable,
      label: "Events",
      rows: (pendingEvents ?? []).map((e) => ({
        id: e.id,
        ownerId: e.organizer_id,
        itemLabel: e.title,
        title: e.title,
        subtitle: `${new Date(e.starts_at).toLocaleDateString("en-KE")} · ${
          e.location ?? "—"
        }`,
      })),
    },
  ];

  const nothingPending = sections.every((s) => s.rows.length === 0);

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">
        Pending listings
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Approve or reject items before they go live on the platform.
      </p>

      {nothingPending && (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="Nothing to review"
            description="New listings across the platform will appear here for approval."
          />
        </div>
      )}

      {sections.map(
        (section) =>
          section.rows.length > 0 && (
            <div key={section.key} className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                {section.label} ({section.rows.length})
              </h2>
              <div className="space-y-2">
                {section.rows.map((row) => (
                  <ModerationRow
                    key={row.id}
                    table={section.key}
                    id={row.id}
                    ownerId={row.ownerId}
                    itemLabel={row.itemLabel}
                    title={row.title}
                    subtitle={row.subtitle}
                  />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
