'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'pill';
}

export function ThemeToggle({ className, showLabel = false, variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none cursor-pointer',
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white shadow-md'
            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-black shadow-sm',
          className
        )}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        aria-label="Toggle theme mode"
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dark Theme</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light Theme</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative w-9 h-9 rounded-xl border transition-all duration-200 group flex items-center justify-center cursor-pointer select-none',
        isDark
          ? 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 shadow-sm'
          : 'bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-400 shadow-sm',
        className
      )}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label="Toggle theme mode"
    >
      <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
        {mounted && !isDark ? (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-cyan-400 transition-transform duration-200 group-hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
