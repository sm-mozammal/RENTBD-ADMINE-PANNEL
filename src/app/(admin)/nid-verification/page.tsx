'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  UserCheck,
} from 'lucide-react';
import type { NIDVerificationRequest, GeoPhotoVerificationRequest } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { DataTable } from '@/components/tables/data-table';
import { NIDReviewModal } from '@/components/modals/nid-review-modal';
import { GeoPhotoModal } from '@/components/modals/geo-photo-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

export default function NIDVerificationQueuePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'nid' | 'geo'>('nid');
  const [nidStatusFilter, setNidStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedNid, setSelectedNid] = useState<NIDVerificationRequest | null>(null);
  const [isNidModalOpen, setIsNidModalOpen] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<GeoPhotoVerificationRequest | null>(null);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

  // Queries
  const { data: nidRequests = [], isLoading: nidLoading } = useQuery({
    queryKey: ['admin-nid-requests'],
    queryFn: () => apiClient.getNIDRequests('all'),
  });

  const { data: geoPhotos = [], isLoading: geoLoading } = useQuery({
    queryKey: ['admin-geo-photos'],
    queryFn: () => apiClient.getGeoPhotos(),
  });

  // Calculate real-time counts for tabs
  const pendingCount = useMemo(
    () => nidRequests.filter((n) => n.status === 'pending').length,
    [nidRequests]
  );
  const approvedCount = useMemo(
    () => nidRequests.filter((n) => n.status === 'approved').length,
    [nidRequests]
  );
  const rejectedCount = useMemo(
    () => nidRequests.filter((n) => n.status === 'rejected').length,
    [nidRequests]
  );

  const displayedNidRequests = useMemo(() => {
    if (nidStatusFilter === 'all') return nidRequests;
    return nidRequests.filter((n) => n.status === nidStatusFilter);
  }, [nidRequests, nidStatusFilter]);

  // Mutations with Toast Feedback
  const approveNidMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiClient.approveNID(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-nid-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nids'] });
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

  const rejectNidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.rejectNID(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-nid-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nids'] });
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

  const verifyGeoMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      apiClient.verifyGeoPhoto(id, approved),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-geo-photos'] });
      toast.info(
        data.status === 'approved' ? 'Geo-Photo Approved' : 'Geo-Photo Rejected',
        `Property listing photo verification updated.`
      );
    },
    onError: (err: any) => {
      toast.error('Validation Failed', err.message || 'Could not verify photo.');
    },
  });

  // TanStack Table Column Definitions for NID Queue
  const nidColumns: ColumnDef<NIDVerificationRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'landlord_name',
        header: 'Landlord & Phone',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.live_selfie_url}
                alt={item.landlord_name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-xs">{item.landlord_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.landlord_phone}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'nid_number',
        header: 'NID Number & Type',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200">{item.nid_number}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {item.nid_type.replace('_', ' ')}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'ai_face_match_confidence',
        header: 'AI Biometric Match',
        cell: ({ row }) => {
          const score = row.original.ai_face_match_confidence;
          const isHigh = score >= 85;
          return (
            <div className="flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${isHigh ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              <Badge variant={isHigh ? 'success' : 'destructive'} size="sm">
                {score}% Match
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'approved') {
            return (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            );
          }
          if (status === 'rejected') {
            return (
              <Badge variant="destructive" size="sm">
                <XCircle className="w-3 h-3" />
                Rejected
              </Badge>
            );
          }
          return (
            <Badge variant="warning" size="sm">
              <Clock className="w-3 h-3" />
              Pending Review
            </Badge>
          );
        },
      },
      {
        accessorKey: 'submitted_at',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatRelativeTime(row.original.submitted_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;
          const isPending = item.status === 'pending';
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setSelectedNid(item);
                  setIsNidModalOpen(true);
                }}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Inspect
              </Button>

              {isPending && (
                <>
                  <Button
                    variant="emerald"
                    size="sm"
                    className="text-xs h-7 px-2 font-medium"
                    disabled={approveNidMutation.isPending}
                    onClick={() => {
                      approveNidMutation.mutate({
                        id: item.id,
                        notes: 'Verified via biometric face match and NID validation.',
                      });
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 px-2 font-medium"
                    disabled={rejectNidMutation.isPending}
                    onClick={() => {
                      setSelectedNid(item);
                      setIsNidModalOpen(true);
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [approveNidMutation, rejectNidMutation]
  );

  // TanStack Table Column Definitions for Geo Photos
  const geoColumns: ColumnDef<GeoPhotoVerificationRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'property_title',
        header: 'Listing & Landlord',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs max-w-xs truncate">
                {item.property_title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.landlord_name}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'distance_difference_meters',
        header: 'GPS Discrepancy',
        cell: ({ row }) => {
          const diff = row.original.distance_difference_meters;
          const isOK = diff <= 50;
          return (
            <Badge variant={isOK ? 'success' : 'destructive'} size="sm">
              {diff}m offset {isOK ? '(Tolerant)' : '(Mismatch)'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'is_camera_live',
        header: 'Camera Check',
        cell: ({ row }) =>
          row.original.is_camera_live ? (
            <Badge variant="cyan" size="sm">
              Live In-App Shot
            </Badge>
          ) : (
            <Badge variant="destructive" size="sm">
              Recycled Gallery
            </Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Verification Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'approved') return <Badge variant="success">Badge Active</Badge>;
          if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
          if (status === 'flagged_gps_mismatch')
            return <Badge variant="destructive">GPS Mismatch</Badge>;
          return <Badge variant="warning">Pending</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              setSelectedGeo(row.original);
              setIsGeoModalOpen(true);
            }}
          >
            <Camera className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            Validate
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Trust & Identity Verification Queues
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Phase 2: Automated NID OCR, biometric facial matching, and GPS-tagged camera validation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('nid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'nid'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Landlord NIDs</span>
            <Badge variant="warning" size="sm">
              {nidRequests.filter((n) => n.status === 'pending').length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('geo')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'geo'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Geo-Tagged Photos</span>
            <Badge variant="cyan" size="sm">
              {geoPhotos.filter((g) => g.status === 'pending').length}
            </Badge>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total NID Applications</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{nidRequests.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">AI Biometric Match Rate</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">94.2% Avg</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Geo-Photo Accuracy Pass</p>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">91.8% Valid</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tab View */}
      {activeTab === 'nid' ? (
        <Card className="glass-card p-4 space-y-4">
          {/* Status Sub-Tabs for NID Submissions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNidStatusFilter('pending')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nidStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review</span>
                <Badge variant={nidStatusFilter === 'pending' ? 'default' : 'warning'} size="sm">
                  {pendingCount}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setNidStatusFilter('approved')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nidStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
                <Badge variant="success" size="sm">
                  {approvedCount}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setNidStatusFilter('rejected')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nidStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected</span>
                <Badge variant="destructive" size="sm">
                  {rejectedCount}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setNidStatusFilter('all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  nidStatusFilter === 'all'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>All Submissions</span>
                <Badge variant="cyan" size="sm">
                  {nidRequests.length}
                </Badge>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{displayedNidRequests.length}</span> records
            </div>
          </div>

          <DataTable
            columns={nidColumns}
            data={displayedNidRequests}
            searchPlaceholder="Search by Landlord Name, Phone, or NID..."
            searchColumnKey="landlord_name"
          />
        </Card>
      ) : (
        <Card className="glass-card p-4">
          <DataTable
            columns={geoColumns}
            data={geoPhotos}
            searchPlaceholder="Search property listings..."
            searchColumnKey="property_title"
          />
        </Card>
      )}

      {/* Inspection Modals */}
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

      <GeoPhotoModal
        request={selectedGeo}
        isOpen={isGeoModalOpen}
        onClose={() => {
          setIsGeoModalOpen(false);
          setSelectedGeo(null);
        }}
        onVerify={async (id, approved) => {
          await verifyGeoMutation.mutateAsync({ id, approved });
        }}
      />
    </div>
  );
}
