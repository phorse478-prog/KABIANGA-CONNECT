import Link from "next/link";
import { Plus, BookOpen, FileText } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { DownloadButton } from "@/components/DownloadButton";
import { cx } from "@/lib/utils";
import {
  RESOURCE_CATEGORY_LABELS,
  type ResourceCategory,
} from "@/lib/types";

export const revalidate = 60;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("resources")
    .select(
      "id, title, description, category, school, department, course, unit, storage_path, download_count, created_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }
  if (searchParams.q) {
    query = query.or(
      `title.ilike.%${searchParams.q}%,course.ilike.%${searchParams.q}%,unit.ilike.%${searchParams.q}%`
    );
  }

  const { data: resources } = await query;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Academic resources
          </h1>
          <p className="text-sm text-gray-500">
            Notes, past papers and study guides shared by fellow students.
          </p>
        </div>
        <Link
          href="/resources/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Upload
        </Link>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/resources"
          className={cx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
            !searchParams.category
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-200 text-gray-600"
          )}
        >
          All
        </Link>
        {(Object.entries(RESOURCE_CATEGORY_LABELS) as [ResourceCategory, string][]).map(
          ([value, label]) => (
            <Link
              key={value}
              href={`/resources?category=${value}`}
              className={cx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm",
                searchParams.category === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 text-gray-600"
              )}
            >
              {label}
            </Link>
          )
        )}
      </div>

      <div className="mt-4">
        {resources && resources.length > 0 ? (
          <div className="space-y-2">
            {resources.map((r) => {
              const { data: publicUrl } = supabase.storage
                .from("resources")
                .getPublicUrl(r.storage_path);
              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {r.title}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {[r.school, r.department, r.course, r.unit]
                          .filter(Boolean)
                          .join(" · ") || "General"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {r.download_count} download
                        {r.download_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <DownloadButton
                    resourceId={r.id}
                    publicUrl={publicUrl.publicUrl}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No resources yet"
            description="Notes, past papers, and study guides you upload will help other students."
            action={
              <Link
                href="/resources/new"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Upload the first resource
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
