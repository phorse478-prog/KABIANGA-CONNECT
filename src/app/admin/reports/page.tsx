import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/reports");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) redirect("/");

  return supabase;
}

async function updateReportStatus(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const status = formData.get("status") as "resolved" | "dismissed";
  const supabase = await requireAdmin();
  await supabase.from("reports").update({ status }).eq("id", id);
  revalidatePath("/admin/reports");
}

const TARGET_LINK: Record<string, string> = {
  product: "/marketplace/",
  hostel: "/hostels/",
  service: "/gigs/",
  vendor: "/food/",
  event: "/events/",
  resource: "/resources/",
};

export default async function AdminReportsPage() {
  const supabase = await requireAdmin();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, status, created_at")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: true });

  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id))];
  const { data: reporters } =
    reporterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", reporterIds)
      : { data: [] as { id: string; full_name: string }[] };

  const reporterName = (id: string) =>
    reporters?.find((r) => r.id === id)?.full_name ?? "A student";

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
      <p className="mt-1 text-sm text-gray-500">
        Content flagged by students, waiting on a decision.
      </p>

      {!reports || reports.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ShieldCheck}
            title="No open reports"
            description="Flagged listings, reviews, or messages will show up here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {reports.map((r) => {
            const link = TARGET_LINK[r.target_type];
            return (
              <div
                key={r.id}
                className="rounded-xl border border-gray-100 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {r.target_type} report
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">{r.reason}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Filed by {reporterName(r.reporter_id)} ·{" "}
                      {timeAgo(r.created_at)}
                    </p>
                    {link && (
                      <a
                        href={`${link}${r.target_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-brand-700 hover:text-brand-800"
                      >
                        View the reported item →
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={updateReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        Dismiss
                      </button>
                    </form>
                    <form action={updateReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                        Mark resolved
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
