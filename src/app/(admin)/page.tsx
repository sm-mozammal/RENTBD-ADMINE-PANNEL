'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  ShieldAlert,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Camera,
  Coins,
  Activity,
  Flame,
  Home,
  Check,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatBDT, formatRelativeTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { NIDReviewModal } from '@/components/modals/nid-review-modal';
import type { NIDVerificationRequest } from '@/lib/types';

export default function DashboardOverviewPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedNid, setSelectedNid] = useState<NIDVerificationRequest | null>(null);
  const [isNidModalOpen, setIsNidModalOpen] = useState(false);
  const [nidTab, setNidTab] = useState<'pending' | 'all'>('pending');

  // Fetch Dashboard Analytics Data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: () => apiClient.getOverviewStats(),
  });

  // Fetch NID Verification Queue
  const { data: nidRequests = [] } = useQuery({
    queryKey: ['admin-pending-nids'],
    queryFn: () => apiClient.getNIDRequests('all'),
  });

  // Fetch Spam Reports Queue
  const { data: spamReports = [] } = useQuery({
    queryKey: ['admin-pending-spam'],
    queryFn: () => apiClient.getSpamReports(),
  });

  // Approve Mutation with Toast
  const approveNidMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient.approveNID(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nids'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nid-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      toast.success(
        'KYC Approved Successfully',
        `Landlord ${data?.landlord_name || 'profile'} is now verified and active.`
      );
    },
    onError: (err: any) => {
      toast.error('Approval Failed', err.message || 'Could not approve verification request.');
    },
  });

  // Reject Mutation with Toast
  const rejectNidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.rejectNID(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nids'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nid-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      toast.warning(
        'KYC Verification Rejected',
        `Request for ${data?.landlord_name || 'landlord'} has been rejected.`
      );
    },
    onError: (err: any) => {
      toast.error('Rejection Failed', err.message || 'Could not reject verification request.');
    },
  });

  const allPendingNids = nidRequests.filter((n) => n.status === 'pending');
  const displayedNids = nidTab === 'pending' ? allPendingNids : nidRequests;
  const pendingSpams = spamReports.filter((s) => s.status === 'pending_review').slice(0, 3);

  // Fallback defaults from stats
  const totalRevenue = stats?.total_revenue_bdt || 4825000;
  const avgMonthlyRent = stats?.average_monthly_rent_bdt || 24500;
  const finance = stats?.finance_analytics;
  const usersAnalytics = stats?.users_analytics;
  const propertiesAnalytics = stats?.properties_analytics;
  const revenueHistory = stats?.monthly_revenue_history || [];
  const topDemandAreas = stats?.top_demand_supply_areas || [];
  const fairBreakdown = stats?.fair_rent_breakdown || { fair_price: 2180, great_deal: 760, overpriced: 340 };
  const catBreakdown = stats?.category_breakdown || { family: 1940, bachelor: 980, sublet: 360, hostel: 80, duplex: 45 };

  // Calculate Fair Rent Percentages
  const totalFairItems = (fairBreakdown.fair_price || 0) + (fairBreakdown.great_deal || 0) + (fairBreakdown.overpriced || 0) || 1;
  const fairPricePct = Math.round(((fairBreakdown.fair_price || 0) / totalFairItems) * 100);
  const greatDealPct = Math.round(((fairBreakdown.great_deal || 0) / totalFairItems) * 100);
  const overpricedPct = Math.round(((fairBreakdown.overpriced || 0) / totalFairItems) * 100);

  // Calculate Bill Progress Percentages
  const totalBills = (finance?.bills_paid_count || 1380) + (finance?.bills_pending_count || 120) + (finance?.bills_overdue_count || 35) || 1;
  const billsPaidPct = Math.round(((finance?.bills_paid_count || 1380) / totalBills) * 100);
  const billsPendingPct = Math.round(((finance?.bills_pending_count || 120) / totalBills) * 100);
  const billsOverduePct = Math.round(((finance?.bills_overdue_count || 35) / totalBills) * 100);

  // Highest revenue in history for proportional bar height
  const maxRevenueHistory = Math.max(...revenueHistory.map((r) => r.revenue), 5000000);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Welcome Operations Live Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-500/20 shadow-sm dark:shadow-xl transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              Operations Live Analytics Feed
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            RentBD Dhaka Rental Ecosystem & Operations
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time biometric KYC verification, AI fair-rent valuation, automated contract ledger, and Dhaka geospatial demand index.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/nid-verification">
            <Button variant="emerald" size="sm" className="font-semibold">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Review NIDs ({stats?.pending_nid_count || 0})
            </Button>
          </Link>
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <Building2 className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Moderate Listings ({stats?.pending_property_count || 0})
            </Button>
          </Link>
          <Link href="/heatmap">
            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-1.5 text-cyan-600 dark:text-cyan-400" />
              Demand Heatmap
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Stat Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registered Users */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {statsLoading ? '...' : (stats?.total_users || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{stats?.users_growth_pct || 14.8}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {usersAnalytics?.tenants_count ? `${usersAnalytics.tenants_count.toLocaleString()} tenants • ${usersAnalytics.landlords_count.toLocaleString()} landlords` : 'Tenants & landlords'}
            </p>
          </CardContent>
        </Card>

        {/* Active Listings */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Listings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {statsLoading ? '...' : (stats?.active_listings || 0).toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{stats?.listings_growth_pct || 22.4}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {propertiesAnalytics?.rented_in_vault ? `${propertiesAnalytics.rented_in_vault} in vault • 41 thanas` : 'Across 41 Dhaka thanas'}
            </p>
          </CardContent>
        </Card>

        {/* Total Rent Transacted (Gross Volume) */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Rent Volume</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {statsLoading ? '...' : formatBDT(totalRevenue)}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{stats?.revenue_growth_pct || 18.2}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Platform MTD transaction ledger
            </p>
          </CardContent>
        </Card>

        {/* Average Monthly Rent */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Monthly Rent</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {statsLoading ? '...' : formatBDT(avgMonthlyRent)}
              </span>
              <Badge variant="cyan" size="sm">
                Dhaka Avg
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Weighted by rental sqft & neighborhood
            </p>
          </CardContent>
        </Card>

        {/* Tenancy Agreements Signed */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tenancy Contracts</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {statsLoading ? '...' : (stats?.rent_agreements_generated || 1420).toLocaleString()}
              </span>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              NID verified legal PDF agreements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Actionable Moderation Queue Badges Quick-Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Link href="/nid-verification" className="block group">
          <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 group-hover:border-amber-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Landlord NIDs</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Biometric & Smart NID</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              {stats?.pending_nid_count || 0}
            </span>
          </div>
        </Link>

        <Link href="/properties" className="block group">
          <div className="p-3.5 rounded-xl border border-blue-300 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 group-hover:border-blue-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Property Review</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Pending Flat Approval</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
              {stats?.pending_property_count || 25}
            </span>
          </div>
        </Link>

        <Link href="/nid-verification" className="block group">
          <div className="p-3.5 rounded-xl border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-950/20 group-hover:border-cyan-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Geo-Photo Checks</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">GPS EXIF Validation</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-600 text-white shadow-xs">
              {stats?.pending_geo_count || 12}
            </span>
          </div>
        </Link>

        <Link href="/ai-spam-detector" className="block group">
          <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/20 group-hover:border-rose-400 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Spam & Broker Flags</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">AI Duplicate Detection</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
              {stats?.pending_spam_count || 14}
            </span>
          </div>
        </Link>
      </div>

      {/* 4. Financial & Revenue Performance Widget (from finance_analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>Financial & Revenue Performance</CardTitle>
              </div>
              <Badge variant="success" size="sm">
                Collection Rate: {finance?.collection_rate_pct || 96.2}%
              </Badge>
            </div>
            <CardDescription>
              Rent collection status, 5% platform service monetization, and payment health across Dhaka rentals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Gross Rent Transacted</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatBDT(finance?.total_revenue_bdt || totalRevenue)}
                </p>
                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{finance?.growth_pct || 18.2}% MTD
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-500/20">
                <p className="text-xs text-slate-500 dark:text-slate-400">Platform Commission (5%)</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatBDT(finance?.total_platform_commission_bdt || 241250)}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Net platform revenue
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">On-Time Collection</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {finance?.collection_rate_pct || 96.2}%
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Auto-disbursed via bKash / Bank
                </span>
              </div>
            </div>

            {/* Bill Payment Health Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Paid Bills: {finance?.bills_paid_count || 1380} ({billsPaidPct}%)
                </span>
                <span className="text-amber-700 dark:text-amber-400">
                  Pending: {finance?.bills_pending_count || 120} ({billsPendingPct}%)
                </span>
                <span className="text-rose-700 dark:text-rose-400">
                  Overdue: {finance?.bills_overdue_count || 35} ({billsOverduePct}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden">
                <div style={{ width: `${billsPaidPct}%` }} className="bg-emerald-500 h-full" title="Paid" />
                <div style={{ width: `${billsPendingPct}%` }} className="bg-amber-400 h-full" title="Pending" />
                <div style={{ width: `${billsOverduePct}%` }} className="bg-rose-500 h-full" title="Overdue" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Role & Trust Segmentation */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Demographics & Trust</CardTitle>
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardDescription>Tenant vs landlord verification ratio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tenants</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {(usersAnalytics?.tenants_count || 13200).toLocaleString()} (71.5%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Landlords</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {(usersAnalytics?.landlords_count || 4850).toLocaleString()} (26.3%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Landlords</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {(usersAnalytics?.verified_landlords_count || 3950).toLocaleString()} (81.4%)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Flagged Brokers (Banned)</span>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {usersAnalytics?.flagged_brokers_count || 18} accounts
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Monthly Revenue & Growth Trend (monthly_revenue_history) */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <CardTitle>Monthly Revenue & Listing Growth History</CardTitle>
            </div>
            <Badge variant="cyan" size="sm">
              Past 6 Months Trajectory
            </Badge>
          </div>
          <CardDescription>
            Historical correlation between active listings inventory, new user registrations, and gross transacted rental volume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {revenueHistory.map((item, idx) => {
              const heightPct = Math.round((item.revenue / maxRevenueHistory) * 100);
              return (
                <div
                  key={item.month || idx}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {item.month}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {formatBDT(item.revenue)}
                    </p>
                  </div>

                  {/* Visual Bar Indicator */}
                  <div className="my-3 h-16 w-full rounded-lg bg-slate-200/80 dark:bg-slate-900 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-md transition-all duration-500"
                    />
                  </div>

                  <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Listings:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.listings}</span>
                    </div>
                    {item.new_users && (
                      <div className="flex justify-between">
                        <span>New Users:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">+{item.new_users}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 6. AI Fair Rent Analysis & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Fair Rent Meter Health */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>AI Fair Rent Meter™ Health</CardTitle>
              </div>
              <Badge variant="default" size="sm">
                Computer Vision + Neighborhood ML
              </Badge>
            </div>
            <CardDescription>
              Continuous valuation of listings comparing sqft, amenities, and historical Dhaka market medians.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Bar Distribution */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Fair Price: {fairBreakdown.fair_price || 2180} ({fairPricePct}%)
                </span>
                <span className="text-teal-700 dark:text-teal-300">
                  Great Deal: {fairBreakdown.great_deal || 760} ({greatDealPct}%)
                </span>
                <span className="text-rose-700 dark:text-rose-400">
                  Overpriced: {fairBreakdown.overpriced || 340} ({overpricedPct}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden">
                <div style={{ width: `${fairPricePct}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${greatDealPct}%` }} className="bg-teal-400 h-full" />
                <div style={{ width: `${overpricedPct}%` }} className="bg-rose-500 h-full" />
              </div>
            </div>

            {/* Detailed Metric Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-emerald-200/90 dark:border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Fair Price</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {(fairBreakdown.fair_price || 2180).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Within ±5% of market</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-teal-200/90 dark:border-teal-500/20">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Great Deal</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {(fairBreakdown.great_deal || 760).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">&gt; 10% below median</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-rose-200/90 dark:border-rose-500/20">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Overpriced</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {(fairBreakdown.overpriced || 340).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">&gt; 25% above median</p>
              </div>
            </div>

            {/* Rent Agreements metric */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200/90 dark:border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">AI Rent Agreement Generator</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Standardized bilingual PDF agreements generated with NID validation
                  </p>
                </div>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {stats?.rent_agreements_generated || 1420} executed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Category Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Accommodation Categories</CardTitle>
              <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardDescription>Target segment distribution across active listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Family Flats</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">2 to 4 bedrooms</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {(catBreakdown.family || 1940).toLocaleString()} (59%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Bachelor Flats</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Students & Professionals</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {(catBreakdown.bachelor || 980).toLocaleString()} (30%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sublet / Master Bed</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Single executive rooms</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {(catBreakdown.sublet || 360).toLocaleString()} (11%)
              </span>
            </div>

            {catBreakdown.hostel !== undefined && (
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Hostel & Student Housing</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Bed-seat rentals</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {(catBreakdown.hostel || 80).toLocaleString()}
                </span>
              </div>
            )}

            {catBreakdown.duplex !== undefined && (
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-teal-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Luxury Duplex & Penthouses</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">High-end properties</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {(catBreakdown.duplex || 45).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7. Geospatial Demand vs. Supply Radar (top_demand_supply_areas) */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <CardTitle>Geospatial Demand vs. Supply Pressure Hubs</CardTitle>
            </div>
            <Link href="/heatmap">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 h-7 px-2">
                Interactive Heatmap
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Dhaka localities with severe search demand surges outpacing available rental units (Opportunity Index).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {topDemandAreas.map((area) => {
              const isExtreme = area.market_pressure === 'extreme_undersupply';
              const isHigh = area.market_pressure === 'high_demand';

              return (
                <div
                  key={area.area_name}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {area.area_name}
                      </span>
                      <Badge
                        variant={isExtreme ? 'destructive' : isHigh ? 'warning' : 'success'}
                        size="sm"
                      >
                        {isExtreme ? 'Critical Deficit' : isHigh ? 'High Demand' : 'Balanced'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{area.thana} Thana</p>
                  </div>

                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Monthly Searches:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {area.demand_searches.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Active Supply:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {area.active_supply} units
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Demand Ratio:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {area.ratio_demand_supply}:1
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Avg Rent</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {formatBDT(area.average_rent_bdt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 8. Urgent Actionable Queues: Interactive NID Queue & AI Spam Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Pending Landlord NIDs Queue */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <CardTitle>NID Verification Queue</CardTitle>
              </div>

              {/* Status Switcher Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNidTab('pending')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    nidTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                  <Badge variant={nidTab === 'pending' ? 'default' : 'warning'} size="sm">
                    {allPendingNids.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setNidTab('all')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    nidTab === 'all'
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>All</span>
                  <Badge variant="cyan" size="sm">
                    {nidRequests.length}
                  </Badge>
                </button>
              </div>

              <Link href="/nid-verification">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400 h-7 px-2">
                  Full Queue
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              {nidTab === 'pending'
                ? `Showing ${allPendingNids.length} landlords awaiting smart card & biometric approval`
                : `Showing all ${nidRequests.length} verification requests`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {displayedNids.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {nidTab === 'pending' ? 'All NID requests processed!' : 'No verification requests found.'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  New submissions from landlords will show up here in real time.
                </p>
              </div>
            ) : (
              displayedNids.map((req) => {
                const isPending = req.status === 'pending';
                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.live_selfie_url}
                        alt={req.landlord_name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {req.landlord_name}
                          </p>
                          <Badge
                            variant={req.ai_face_match_confidence >= 85 ? 'success' : 'warning'}
                            size="sm"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {req.ai_face_match_confidence}% AI Match
                          </Badge>
                          {req.status === 'approved' && (
                            <Badge variant="success" size="sm">
                              Verified
                            </Badge>
                          )}
                          {req.status === 'rejected' && (
                            <Badge variant="destructive" size="sm">
                              Rejected
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          NID: {req.nid_number} • {req.landlord_phone} • {formatRelativeTime(req.submitted_at)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: Quick Approve, Reject, and Inspect */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2"
                        title="Inspect full documents and details"
                        onClick={() => {
                          setSelectedNid(req);
                          setIsNidModalOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Inspect
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            variant="emerald"
                            size="sm"
                            className="text-xs h-7 px-2.5 font-semibold"
                            disabled={approveNidMutation.isPending}
                            onClick={() => {
                              approveNidMutation.mutate({
                                id: req.id,
                                notes: 'Verified via biometric face match and NID validation.',
                              });
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verify
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs h-7 px-2"
                            disabled={rejectNidMutation.isPending}
                            onClick={() => {
                              setSelectedNid(req);
                              setIsNidModalOpen(true);
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* AI Spam & Duplicate Alert Queue */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <CardTitle>AI Spam & Duplicate Queue</CardTitle>
              </div>
              <Link href="/ai-spam-detector">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400">
                  View All ({stats?.pending_spam_count || 0})
                </Button>
              </Link>
            </div>
            <CardDescription>Flagged for duplicate photos or suspicious prices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSpams.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No spam listings detected!</p>
            ) : (
              pendingSpams.map((spam) => (
                <div
                  key={spam.id}
                  className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-slate-950/60 border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" size="sm">
                        {spam.ai_confidence_score}% Fraud Confidence
                      </Badge>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(spam.detected_at)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 mt-1 truncate">
                      {spam.property_title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      By {spam.landlord_name} ({spam.landlord_phone})
                    </p>
                  </div>

                  <Link href="/ai-spam-detector">
                    <Button variant="destructive" size="sm" className="text-xs">
                      Review
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Modal for Dashboard */}
      <NIDReviewModal
        request={selectedNid}
        isOpen={isNidModalOpen}
        onClose={() => {
          setIsNidModalOpen(false);
          setSelectedNid(null);
        }}
        onApprove={async (id, notes) => {
          await approveNidMutation.mutateAsync({ id, notes });
        }}
        onReject={async (id, reason) => {
          await rejectNidMutation.mutateAsync({ id, reason });
        }}
      />
    </div>
  );
}
