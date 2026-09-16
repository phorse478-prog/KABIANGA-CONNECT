import { cx } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-blue-50 text-blue-700",
  preparing: "bg-blue-50 text-blue-700",
  ready: "bg-violet-50 text-violet-700",
  out_for_delivery: "bg-violet-50 text-violet-700",
  delivered: "bg-brand-50 text-brand-700",
  cancelled: "bg-red-50 text-red-700",
  paid: "bg-brand-50 text-brand-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

const LABELS: Record<string, string> = {
  out_for_delivery: "Out for delivery",
};

export function StatusBadge({ status }: { status: string }) {
  const label =
    LABELS[status] ??
    status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <span
      className={cx(
        "inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        STYLES[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {label}
    </span>
  );
}
