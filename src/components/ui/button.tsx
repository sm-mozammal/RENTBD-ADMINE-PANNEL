import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.98]',
    emerald:
      'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 active:scale-[0.98]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-none active:scale-[0.98]',
    outline:
      'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:border-slate-500 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800/60 shadow-sm dark:shadow-none active:scale-[0.98]',
    ghost:
      'hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white',
    destructive:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 dark:shadow-rose-950/40 active:scale-[0.98]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5 font-medium',
    md: 'text-sm px-4 py-2 rounded-lg gap-2 font-medium',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 font-semibold',
    icon: 'h-9 w-9 p-0 rounded-lg flex items-center justify-center',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
