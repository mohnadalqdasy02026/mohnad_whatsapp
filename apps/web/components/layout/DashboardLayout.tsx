'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Inbox, Users, Settings, LogOut, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import clsx from 'clsx';

const links = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/inbox', label: 'الرسائل', icon: Inbox },
  { href: '/dashboard/whatsapp', label: 'ربط واتساب', icon: Smartphone },
  { href: '/team', label: 'الفريق', icon: Users, adminOnly: true },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="h-screen flex flex-col bg-wa-panel">
      {/* Top bar (mobile) */}
      <header className="md:hidden bg-wa-green-darker text-white flex items-center justify-between px-4 py-3">
        <div className="font-bold">📨 صندوق الوارد</div>
        <button onClick={() => { logout(); router.push('/login'); }} className="text-sm">خروج</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex w-60 bg-white border-l flex-col">
          <div className="px-5 py-4 border-b">
            <div className="text-lg font-bold text-wa-green-darker">📨 صندوق الوارد</div>
            <div className="text-xs text-gray-500 mt-0.5">{user?.email}</div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {links
              .filter((l) => !l.adminOnly || user?.role === 'ADMIN')
              .map((l) => {
                const Icon = l.icon;
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                      active
                        ? 'bg-wa-green text-white'
                        : 'text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    <Icon size={18} />
                    <span>{l.label}</span>
                  </Link>
                );
              })}
          </nav>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 text-sm border-t"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden bg-white border-t flex justify-around py-2">
        {links
          .filter((l) => !l.adminOnly || user?.role === 'ADMIN')
          .slice(0, 4)
          .map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'flex flex-col items-center text-xs gap-0.5',
                  active ? 'text-wa-green' : 'text-gray-500',
                )}
              >
                <Icon size={20} />
                {l.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
