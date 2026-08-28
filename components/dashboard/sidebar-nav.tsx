'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/automations', label: 'Automations' },
  { href: '/dashboard/accounts', label: 'Accounts' },
  { href: '/dashboard/logs', label: 'Logs' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function SidebarNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel flex w-full flex-col gap-1 p-4 sm:w-56 sm:shrink-0">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.25em] text-neon-glow">THETRENDSETTA</p>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/dashboard' ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-neon-blue/15 text-neon-glow shadow-glow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-matte-border pt-4">
        <p className="mb-2 truncate px-2 text-xs text-slate-500">{userName}</p>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-secondary w-full text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
}
