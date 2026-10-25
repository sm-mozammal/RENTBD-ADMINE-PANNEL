'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertOctagon,
  Sparkles,
  Server,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, mockMode, toggleMockMode } = useAuth();

  const [identifier, setIdentifier] = useState('admin@rentbd.com');
  const [password, setPassword] = useState('Admin@RentBD2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(identifier, password);
      router.push('/');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Access Denied: Invalid credentials or insufficient administrative permissions.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setIdentifier('admin@rentbd.com');
    setPassword('Admin@RentBD2026');
    setError(null);
  };

  const handleFillNonAdminTest = () => {
    setIdentifier('tenant@rentbd.com');
    setPassword('Tenant@2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-lg">
        {/* Top Floating Bar */}
        <div className="flex items-center justify-between sm:justify-center gap-2 mb-4 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-md backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
              RentBD Security Gateway
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMockMode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-90 active:scale-95 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 shadow-sm"
              title="Click to toggle between Mock and Live Django REST API"
            >
              {mounted && mockMode ? (
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              )}
              <span>{mounted && mockMode ? 'Mock Mode' : 'Live REST'}</span>
            </button>

            <ThemeToggle showLabel={false} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-slate-200/60 dark:shadow-black/80 transition-colors">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-600/30 dark:shadow-emerald-950/60 mb-3.5">
              R
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">RentBD Admin Portal</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Super Admin & Operations Console for Bangladesh Rental Trust, NID Verification & Moderation
            </p>
          </div>

          {/* Strict Role Guard Notice */}
          <div className="mb-6 p-3.5 rounded-xl border border-amber-400/30 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/10 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-amber-900 dark:text-amber-300">Role Restriction Enforced</p>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                Only authenticated accounts with the role <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">admin</span> can access this dashboard. Public, tenant, and landlord accounts are strictly barred.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200 flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold block text-rose-900 dark:text-rose-200">Authentication Error:</span>
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Admin Email or Bangladeshi Mobile
              </label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@rentbd.com or +8801700000000"
                required
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Administrator Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                icon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full mt-2 font-semibold shadow-lg shadow-emerald-600/30 dark:shadow-emerald-950/60 flex items-center justify-center gap-2"
              isLoading={isLoading}
            >
              <span>Authenticate as Administrator</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Credential Test Pickers */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 text-center">
              Quick Role Test Shortcuts
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Authorized Admin Option */}
              <button
                type="button"
                onClick={handleFillAdmin}
                className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/80 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-200">
                    Super Admin
                  </span>
                  <Badge variant="default" size="sm" className="text-[9px]">
                    Role: admin
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">admin@rentbd.com</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Access Allowed</span>
                </p>
              </button>

              {/* Non-Admin Test Option */}
              <button
                type="button"
                onClick={handleFillNonAdminTest}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/80 hover:bg-rose-100/70 dark:bg-rose-950/15 dark:hover:bg-rose-950/30 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 group-hover:text-rose-900 dark:group-hover:text-rose-200">
                    Tenant Account
                  </span>
                  <Badge variant="destructive" size="sm" className="text-[9px]">
                    Role: tenant
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">tenant@rentbd.com</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
                  <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>Access Blocked</span>
                </p>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-3.5">
              Test with the Tenant account above to verify that non-admin accounts are rejected with an access denial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
