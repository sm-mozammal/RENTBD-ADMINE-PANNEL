'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/context/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/login');
      }
    }
  }, [mounted, user, isLoading, router]);

  if (!mounted || isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center text-slate-600 dark:text-slate-400 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
