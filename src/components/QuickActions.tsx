import Link from "next/link";
import {
  ShoppingBag,
  Home as HomeIcon,
  UtensilsCrossed,
  Briefcase,
  BookOpen,
  CalendarDays,
} from "lucide-react";

const actions = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/hostels", label: "Find Hostel", icon: HomeIcon },
  { href: "/food", label: "Order Food", icon: UtensilsCrossed },
  { href: "/gigs", label: "Find Gigs", icon: Briefcase },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </Link>
      ))}
    </div>
  );
}
