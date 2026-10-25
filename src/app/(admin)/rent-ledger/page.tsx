'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Download,
  DollarSign,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import type { RentLedgerTransaction } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { formatBDT, formatDateOnly } from '@/lib/utils';
import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function RentLedgerPage() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-rent-ledger'],
    queryFn: () => apiClient.getLedgerTransactions(),
  });

  const totalCollected = transactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.total_paid_bdt, 0);

  const totalPlatformFees = transactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.platform_fee_collected, 0);

  const columns: ColumnDef<RentLedgerTransaction>[] = useMemo(
    () => [
      {
        accessorKey: 'property_title',
        header: 'Property & Tenants',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs max-w-xs truncate">
                {item.property_title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Landlord: {item.landlord_name} • Tenant: {item.tenant_name}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'month',
        header: 'Billing Month',
        cell: ({ row }) => <span className="text-xs text-slate-700 dark:text-slate-200">{row.original.month}</span>,
      },
      {
        accessorKey: 'total_paid_bdt',
        header: 'Total Paid (BDT)',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {formatBDT(item.total_paid_bdt)}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Rent: {formatBDT(item.base_rent_bdt)} | Srv: {formatBDT(item.service_charge_bdt)}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'payment_method',
        header: 'Method',
        cell: ({ row }) => {
          const method = row.original.payment_method;
          return (
            <Badge
              variant={
                method === 'bKash'
                  ? 'destructive'
                  : method === 'Nagad'
                  ? 'warning'
                  : method === 'Bank_Transfer'
                  ? 'cyan'
                  : 'secondary'
              }
              size="sm"
            >
              {method.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'platform_fee_collected',
        header: 'Platform Fee',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
            {formatBDT(row.original.platform_fee_collected)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'paid')
            return (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                Paid
              </Badge>
            );
          return (
            <Badge variant="warning" size="sm">
              <Clock className="w-3 h-3" />
              Pending
            </Badge>
          );
        },
      },
      {
        accessorKey: 'transaction_date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatDateOnly(row.original.transaction_date)}
          </span>
        ),
      },
      {
        id: 'receipt',
        header: 'Receipt',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400">
            <Download className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Digital Rent & Utility Ledger
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Automated monthly rent tracking, bKash/Nagad digital receipts, and platform monetization fee accounting.
          </p>
        </div>

        <Button variant="emerald" size="sm" className="self-start font-semibold">
          <Download className="w-4 h-4 mr-1.5" />
          Export Ledger (CSV)
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Processed Rent Volume (MTD)</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatBDT(totalCollected)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Platform Monetization Fees</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(totalPlatformFees)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Automated Receipts Issued</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                {transactions.length} Receipts
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card p-4">
        <DataTable
          columns={columns}
          data={transactions}
          searchPlaceholder="Search transactions by property or landlord..."
          searchColumnKey="property_title"
        />
      </Card>
    </div>
  );
}
