import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
    cyan: 'bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-0.5 font-medium rounded-md',
    lg: 'text-sm px-3 py-1 font-semibold rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
