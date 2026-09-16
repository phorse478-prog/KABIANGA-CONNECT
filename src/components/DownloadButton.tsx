"use client";

import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DownloadButton({
  resourceId,
  publicUrl,
}: {
  resourceId: string;
  publicUrl: string;
}) {
  const supabase = createClient();

  async function handleClick() {
    // Fire-and-forget — don't block opening the file on this.
    supabase.rpc("increment_resource_downloads", { resource_id: resourceId });
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
    >
      <Download className="h-3.5 w-3.5" /> Download
    </button>
  );
}
