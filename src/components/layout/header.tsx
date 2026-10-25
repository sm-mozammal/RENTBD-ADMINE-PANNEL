'use client';

import React from 'react';
import { Bell, Database, Server, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'RentBD Dashboard', subtitle }: HeaderProps) {
  const { mockMode, toggleMockMode } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md px-5 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 shadow-sm dark:shadow-none">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Zero-Rework Mock Mode Toggle Switch */}
        <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1 shadow-inner">
          <div className="hidden sm:flex items-center gap-1.5">
            {mounted && mockMode ? (
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {mounted && mockMode ? 'Mock Mode' : 'Django API'}
            </span>
          </div>

          <Badge
            variant={mounted && mockMode ? 'default' : 'cyan'}
            size="sm"
            className="cursor-pointer select-none hover:opacity-90 active:scale-95"
            onClick={toggleMockMode}
          >
            {mounted && mockMode ? 'MOCK' : 'LIVE'}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMockMode}
            className="h-6 px-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            title="Toggle between local mock data and live Django REST backend"
          >
            Switch
          </Button>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm dark:shadow-none"
          title="Operations Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#090d16]" />
        </button>

        {/* Live Pulse status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Dhaka Live</span>
        </div>
      </div>
    </header>
  );
}
