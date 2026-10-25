'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Bot,
  MapPin,
  Users,
  Receipt,
  LogOut,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SidebarProps {
  pendingNidCount?: number;
  pendingSpamCount?: number;
}

export function Sidebar({ pendingNidCount = 2, pendingSpamCount = 3 }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      title: 'Dashboard Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: 'NID & Geo-Photos',
      href: '/nid-verification',
      icon: ShieldCheck,
      badge: pendingNidCount > 0 ? `${pendingNidCount}` : null,
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Property Moderation',
      href: '/properties',
      icon: Building2,
      badge: null,
    },
    {
      title: 'AI Spam & Duplicate',
      href: '/ai-spam-detector',
      icon: Bot,
      badge: pendingSpamCount > 0 ? `${pendingSpamCount}` : null,
      badgeVariant: 'destructive' as const,
    },
    {
      title: 'Demand Heatmap',
      href: '/heatmap',
      icon: MapPin,
      badge: 'Live',
      badgeVariant: 'cyan' as const,
    },
    {
      title: 'Users & Landlords',
      href: '/users',
      icon: Users,
      badge: null,
    },
    {
      title: 'Rent & Monetization',
      href: '/rent-ledger',
      icon: Receipt,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white/95 dark:bg-[#0b101b] border-r border-slate-200/90 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none min-h-screen transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950/60">
              <span className="text-base font-extrabold leading-none">R</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">RentBD</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wide">Bangladesh Rent Ecosystem</p>
            </div>
          </Link>
        </div>

        {/* Section Title */}
        <div className="px-6 pt-5 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Control Center
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25 dark:shadow-emerald-950/30 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'default'} size="sm">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Engine Status Card */}
        <div className="px-4 mt-6">
          <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-950/20 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">AI Trust Engine</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Photo classifier, fair rent pricing, and duplicate detectors active.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Admin'}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.occupation || 'Operations Lead'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle className="w-8 h-8 rounded-lg" />
            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
