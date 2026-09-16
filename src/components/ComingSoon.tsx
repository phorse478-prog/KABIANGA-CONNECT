import { Sparkles } from "lucide-react";

// Use this instead of a broken button or a placeholder action for any
// feature that isn't wired up yet — never pretend something works.
export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Sparkles className="h-4 w-4 shrink-0" />
      <span>{label} is coming soon.</span>
    </div>
  );
}
