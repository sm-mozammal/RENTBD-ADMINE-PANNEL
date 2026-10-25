'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Bot,
  AlertTriangle,
  Copy,
  Ban,
  UserX,
  CheckCircle,
  Eye,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import type { SpamReport } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { formatBDT, formatRelativeTime } from '@/lib/utils';
import { DataTable } from '@/components/tables/data-table';
import { SpamDiffModal } from '@/components/modals/spam-diff-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AISpamDetectorPage() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<SpamReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-spam-reports'],
    queryFn: () => apiClient.getSpamReports(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'listing_banned' | 'landlord_blocked' | 'false_positive';
    }) => apiClient.resolveSpamReport(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spam-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-stats'] });
    },
  });

  const columns: ColumnDef<SpamReport>[] = useMemo(
    () => [
      {
        accessorKey: 'property_title',
        header: 'Flagged Listing & Landlord',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs max-w-sm truncate">
                {item.property_title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Landlord: <span className="text-slate-700 dark:text-slate-300 font-medium">{item.landlord_name}</span> (
                {item.landlord_phone})
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'rent_bdt',
        header: 'Stated Rent vs Median',
        cell: ({ row }) => {
          const item = row.original;
          const diffPct = Math.round(
            ((item.rent_bdt - item.average_area_rent) / item.average_area_rent) * 100
          );
          return (
            <div>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                {formatBDT(item.rent_bdt)}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Area: {formatBDT(item.average_area_rent)} ({diffPct}%)
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'flags',
        header: 'Detected Violations',
        cell: ({ row }) => {
          const flags = row.original.flags;
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {flags.map((f, i) => (
                <Badge
                  key={i}
                  variant={f.severity === 'critical' ? 'destructive' : 'warning'}
                  size="sm"
                >
                  {f.type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'ai_confidence_score',
        header: 'AI Confidence',
        cell: ({ row }) => {
          const score = row.original.ai_confidence_score;
          return (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <Badge variant={score > 85 ? 'destructive' : 'warning'} size="sm">
                {score}% Fraud Prob
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Queue Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'listing_banned') return <Badge variant="destructive">Banned</Badge>;
          if (status === 'landlord_blocked')
            return <Badge variant="destructive">Broker Blacklisted</Badge>;
          if (status === 'false_positive') return <Badge variant="success">Approved</Badge>;
          return <Badge variant="warning">Pending Action</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <Button
            variant="destructive"
            size="sm"
            className="text-xs"
            onClick={() => {
              setSelectedReport(row.original);
              setIsModalOpen(true);
            }}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Compare Diff
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          AI Spam & Duplicate Detector Queue
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Automatic perceptual image hashing, advance deposit scam anomaly detection, and broker phone correlation.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Flagged Incidents</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{reports.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Bot className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Image Hash Match Accuracy</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">99.2%</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Copy className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Banned Middlemen Phone Records</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">1,480</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="glass-card p-4">
        <DataTable
          columns={columns}
          data={reports}
          searchPlaceholder="Search flagged reports by title or landlord..."
          searchColumnKey="property_title"
        />
      </Card>

      {/* Compare Diff Modal */}
      <SpamDiffModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
        onResolve={async (id, action) => {
          await resolveMutation.mutateAsync({ id, action });
        }}
      />
    </div>
  );
}
