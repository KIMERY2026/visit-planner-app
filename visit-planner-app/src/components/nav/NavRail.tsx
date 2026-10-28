"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "This Week" },
  { href: "/places", label: "Places" },
  { href: "/history", label: "History" },
];

export function NavRail({ userName, role }: { userName: string; role: string }) {
  const active = usePathname();
  return (
    <>
      {/* Desktop rail */}
      <nav className="hidden md:flex md:flex-col w-48 shrink-0 border-r border-line/15 bg-surface min-h-screen sticky top-0 px-4 py-6">
        <div className="font-display text-lg font-semibold text-accent mb-8">Visit Planner</div>
        <div className="flex flex-col gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active === t.href ? "bg-surface2 text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-line/15">
          <div className="text-sm font-semibold">{userName}</div>
          <div className="text-xs text-muted mb-2">{role}</div>
          <SignOutButton />
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex bg-surface border-t border-line/15 z-20">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 text-center py-3 text-xs font-semibold ${
              active === t.href ? "text-accent" : "text-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
