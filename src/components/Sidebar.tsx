"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/pipeline", label: "Content Pipeline" },
  { href: "/research", label: "Research" },
  { href: "/competitors", label: "Competitor Intel" },
  { href: "/analytics", label: "Analytics" },
  { href: "/weekly-review", label: "Weekly Review" },
  { href: "/leads", label: "Leads" },
  { href: "/lead-magnets", label: "Lead Magnets" },
  { href: "/templates", label: "Templates" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-matte-950/60 p-4 md:block">
      <div className="mb-6 px-2">
        <p className="font-display text-sm font-bold tracking-widest text-neon-400">
          THETRENDSETTA™
        </p>
        <p className="text-xs text-white/40">Social Media OS</p>
      </div>
      <ul className="space-y-1">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-neon-500/10 text-neon-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
