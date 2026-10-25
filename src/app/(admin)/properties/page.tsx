'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  Building2,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Camera,
  Layers,
  Bed,
  Bath,
  Maximize2,
  Clock,
  Check,
  X,
} from 'lucide-react';
import type { Property, PropertyStatus, PropertyCategory } from '@/lib/types';
import { apiClient, normalizeImageUrl } from '@/lib/api-client';
import { formatBDT } from '@/lib/utils';
import { DataTable } from '@/components/tables/data-table';
import { PropertyDetailsModal } from '@/components/modals/property-details-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function PropertiesModerationPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => apiClient.getProperties(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: PropertyStatus;
      notes?: string;
    }) => apiClient.updatePropertyStatus(id, status, notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      if (selectedProperty?.id === updated.id) {
        setSelectedProperty(updated);
      }
    },
  });

  // Inline Quick Actions
  const handleQuickApprove = async (e: React.MouseEvent, prop: Property) => {
    e.stopPropagation();
    setActionLoadingId(`approve-${prop.id}`);
    try {
      await updateStatusMutation.mutateAsync({
        id: prop.id,
        status: 'active',
        notes: 'Quick-approved from moderation dashboard queue.',
      });
      toast.success('Listing Approved', `"${prop.title}" is now active and published.`);
    } catch (err: any) {
      toast.error('Approval Failed', err?.message || 'Could not update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickReject = async (e: React.MouseEvent, prop: Property) => {
    e.stopPropagation();
    setActionLoadingId(`reject-${prop.id}`);
    try {
      await updateStatusMutation.mutateAsync({
        id: prop.id,
        status: 'rejected',
        notes: 'Quick-rejected from moderation table queue.',
      });
      toast.warning('Listing Rejected', `"${prop.title}" has been set to rejected.`);
    } catch (err: any) {
      toast.error('Rejection Failed', err?.message || 'Could not update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = properties.length;
    const pending = properties.filter((p) => p.status === 'pending_approval').length;
    const active = properties.filter((p) => p.status === 'active').length;
    const flagged = properties.filter((p) => p.status === 'flagged_spam' || p.status === 'rejected').length;
    return { total, pending, active, flagged };
  }, [properties]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return properties.filter((p) => {
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchCategory && matchStatus;
    });
  }, [properties, categoryFilter, statusFilter]);

  // TanStack Table columns
  const columns: ColumnDef<Property>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Listing & Photos',
        cell: ({ row }) => {
          const item = row.original;
          const hasPhotos = Boolean(item.photos && item.photos.length > 0);
          const photoCount = item.photos?.length || 0;
          const photoUrl = hasPhotos ? normalizeImageUrl(item.photos[0]) : '';

          return (
            <div className="flex items-center gap-3">
              {/* Thumbnail with API Photo Count Badge or No Photo Placeholder */}
              {hasPhotos ? (
                <div className="relative w-14 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shrink-0 shadow-sm group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      if (!e.currentTarget.src.includes('unsplash')) {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=120';
                      }
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 text-[9px] font-bold text-white text-center flex items-center justify-center gap-0.5 backdrop-blur-[2px]">
                    <Camera className="w-2.5 h-2.5" />
                    <span>{photoCount}</span>
                  </div>
                </div>
              ) : (
                <div className="relative w-14 h-12 rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 shrink-0 shadow-sm flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Camera className="w-4 h-4 opacity-50" />
                  <span className="text-[8px] font-medium leading-none mt-0.5">No photo</span>
                </div>
              )}

              <div className="min-w-0 max-w-xs">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {item.thana}, {item.district}
                  </span>
                  {item.property_type && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {item.property_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant="cyan" size="sm" className="capitalize font-semibold">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'rent_bdt',
        header: 'Rent (BDT)',
        cell: ({ row }) => (
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
              {formatBDT(row.original.rent_bdt)}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              +{formatBDT(row.original.service_charge_bdt)} service
            </p>
            {row.original.advance_deposit_bdt > 0 && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                Dep: {formatBDT(row.original.advance_deposit_bdt)}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'specs',
        header: 'Specs',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
              <span className="font-semibold block">
                {item.bedrooms} Bed • {item.bathrooms} Bath • {item.balconies} Balcony
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {item.size_sqft} sqft • Floor {item.floor_level}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'fair_price_meter',
        header: 'AI Fair Rent',
        cell: ({ row }) => {
          const meter = row.original.fair_price_meter;
          return (
            <Badge
              variant={
                meter.status === 'Overpriced'
                  ? 'destructive'
                  : meter.status === 'Great Deal'
                  ? 'cyan'
                  : 'success'
              }
              size="sm"
              className="font-medium"
            >
              <Sparkles className="w-3 h-3" />
              {meter.status} ({meter.difference_percentage > 0 ? '+' : ''}
              {meter.difference_percentage}%)
            </Badge>
          );
        },
      },
      {
        accessorKey: 'has_geo_verified_photo',
        header: 'Geo Photo',
        cell: ({ row }) =>
          row.original.has_geo_verified_photo ? (
            <Badge variant="success" size="sm">
              <ShieldCheck className="w-3 h-3" />
              Verified GPS
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              Pending
            </Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'active') return <Badge variant="success">Active</Badge>;
          if (status === 'flagged_spam') return <Badge variant="destructive">Flagged Spam</Badge>;
          if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
          return <Badge variant="warning">Pending Review</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const prop = row.original;
          const isApproveLoading = actionLoadingId === `approve-${prop.id}`;
          const isRejectLoading = actionLoadingId === `reject-${prop.id}`;

          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold hover:border-emerald-500"
                onClick={() => {
                  setSelectedProperty(prop);
                  setIsModalOpen(true);
                }}
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                Inspect
              </Button>

              {prop.status !== 'active' && (
                <button
                  type="button"
                  title="Quick Approve Listing"
                  onClick={(e) => handleQuickApprove(e, prop)}
                  disabled={actionLoadingId !== null}
                  className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}

              {prop.status !== 'rejected' && (
                <button
                  type="button"
                  title="Quick Reject Listing"
                  onClick={(e) => handleQuickReject(e, prop)}
                  disabled={actionLoadingId !== null}
                  className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [actionLoadingId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Property Moderation & Quality Control</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Phase 3: Inspect property details, view photos from API, evaluate AI fair rent & verify listings.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          {(['all', 'family', 'bachelor', 'sublet'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Types' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top Moderation KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Listings</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </Card>

        <Card className="glass-card p-4 border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pending Review</span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{metrics.pending}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </Card>

        <Card className="glass-card p-4 border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Active Listings</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.active}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </Card>

        <Card className="glass-card p-4 border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Flagged / Rejected</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{metrics.flagged}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 shrink-0">Filter by Status:</span>
        {(['all', 'pending_approval', 'active', 'flagged_spam', 'rejected'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg transition-all text-xs font-medium shrink-0 ${
                statusFilter === status
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {status === 'all'
                ? 'All Statuses'
                : status === 'pending_approval'
                ? 'Pending Review'
                : status.replace('_', ' ').toUpperCase()}
            </button>
          )
        )}
      </div>

      {/* Main Table */}
      <Card className="glass-card p-4">
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search listings by title, location or thana..."
          searchColumnKey="title"
        />
      </Card>

      {/* Property Details Inspection Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProperty(null);
        }}
        onUpdateStatus={async (id, status, notes) => {
          await updateStatusMutation.mutateAsync({ id, status, notes });
        }}
      />
    </div>
  );
}
