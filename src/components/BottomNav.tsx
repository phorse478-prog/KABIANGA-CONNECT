"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, ClipboardList, User } from "lucide-react";
import { cx } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Explore", icon: Compass },
  { href: "/marketplace/new", label: "Sell", icon: PlusCircle },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-brand-700" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
