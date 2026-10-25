'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Ban,
  Building,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { formatDateOnly } from '@/lib/utils';
import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.getUsers(),
  });

  const toggleBrokerMutation = useMutation({
    mutationFn: (userId: string) => apiClient.toggleBrokerStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User & Profile',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  user.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">{user.name}</p>
                  {user.is_flagged_broker && (
                    <Badge variant="destructive" size="sm">
                      Broker Flagged
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.occupation || 'N/A'}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.role === 'landlord'
                ? 'cyan'
                : row.original.role === 'admin'
                ? 'purple'
                : 'default'
            }
            size="sm"
            className="capitalize"
          >
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact Info',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-slate-400" />
              {row.original.phone}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400" />
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'nid_status',
        header: 'NID Status',
        cell: ({ row }) => {
          const status = row.original.nid_status;
          if (status === 'verified')
            return (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            );
          if (status === 'pending')
            return (
              <Badge variant="warning" size="sm">
                <Clock className="w-3 h-3" />
                Pending
              </Badge>
            );
          if (status === 'rejected')
            return (
              <Badge variant="destructive" size="sm">
                Rejected
              </Badge>
            );
          return (
            <Badge variant="secondary" size="sm">
              Unverified
            </Badge>
          );
        },
      },
      {
        accessorKey: 'listings_count',
        header: 'Listings',
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">{row.original.listings_count}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">posted</span>
          </div>
        ),
      },
      {
        accessorKey: 'joined_at',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateOnly(row.original.joined_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Anti-Broker Action',
        cell: ({ row }) => {
          const isBroker = row.original.is_flagged_broker;
          return (
            <Button
              variant={isBroker ? 'outline' : 'destructive'}
              size="sm"
              className="text-xs"
              onClick={() => toggleBrokerMutation.mutate(row.original.id)}
            >
              {isBroker ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                  Unflag
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  Flag Broker
                </>
              )}
            </Button>
          );
        },
      },
    ],
    [toggleBrokerMutation]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            User Directory & Anti-Broker Registry
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Manage genuine property owners, verify tenant credentials, and blacklist middleman broker syndicates.
          </p>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          {(['all', 'landlord', 'tenant', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                roleFilter === role
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {role === 'all' ? 'All Users' : role + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="glass-card p-4">
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchPlaceholder="Search users by name, phone, or email..."
          searchColumnKey="name"
        />
      </Card>
    </div>
  );
}
