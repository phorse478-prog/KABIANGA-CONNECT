import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/users");

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) redirect("/");

  return supabase;
}

async function toggleSuspend(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const nextValue = formData.get("nextValue") === "true";
  const supabase = await requireAdmin();
  await supabase
    .from("profiles")
    .update({ is_suspended: nextValue })
    .eq("id", id);
  revalidatePath("/admin/users");
}

async function toggleVerify(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const nextValue = formData.get("nextValue") === "true";
  const supabase = await requireAdmin();
  await supabase
    .from("profiles")
    .update({ is_verified: nextValue })
    .eq("id", id);
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const supabase = await requireAdmin();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, is_verified, is_suspended, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Manage users</h1>
      <p className="mt-1 text-sm text-gray-500">
        Verify trusted sellers/vendors or suspend accounts that break the
        rules.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users && users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 text-gray-900">
                    {u.full_name}
                    {u.is_verified && (
                      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {u.is_suspended ? (
                      <span className="text-red-600">Suspended</span>
                    ) : (
                      <span className="text-gray-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <form action={toggleVerify}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="nextValue"
                          value={(!u.is_verified).toString()}
                        />
                        <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                          {u.is_verified ? "Unverify" : "Verify"}
                        </button>
                      </form>
                      <form action={toggleSuspend}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="nextValue"
                          value={(!u.is_suspended).toString()}
                        />
                        <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600">
                          {u.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
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
  );
}
