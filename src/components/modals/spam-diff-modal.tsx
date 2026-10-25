'use client';

import React, { useState } from 'react';
import {
  Bot,
  AlertOctagon,
  Copy,
  Ban,
  UserX,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import type { SpamReport } from '@/lib/types';
import { formatBDT } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SpamDiffModalProps {
  report: SpamReport | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (
    id: string,
    action: 'listing_banned' | 'landlord_blocked' | 'false_positive'
  ) => Promise<void>;
}

export function SpamDiffModal({
  report,
  isOpen,
  onClose,
  onResolve,
}: SpamDiffModalProps) {
  const [loading, setLoading] = useState(false);

  if (!report) return null;

  const handleAction = async (
    action: 'listing_banned' | 'landlord_blocked' | 'false_positive'
  ) => {
    setLoading(true);
    try {
      await onResolve(report.id, action);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isCritical = report.flags.some((f) => f.severity === 'critical');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-rose-400" />
          <span>AI Fraud & Duplicate Listing Inspection</span>
        </div>
      }
      description={`Automated flag #${report.id} • AI Confidence: ${report.ai_confidence_score}%`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Flag Severity Alert */}
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-rose-800 dark:text-rose-300">
                {report.ai_confidence_score}% Suspicion Probability
              </span>
              <Badge variant="destructive" size="sm">
                {isCritical ? 'Critical Action Required' : 'Review Queue'}
              </Badge>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              Our automated heuristics flagged this listing for advance deposit scam indicators,
              recycled photos, or broker phone patterns.
            </p>
          </div>
        </div>

        {/* Flag Reasons Breakdown */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
            Triggered Anti-Fraud Rules ({report.flags.length})
          </span>
          <div className="space-y-2">
            {report.flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {flag.type.replace(/_/g, ' ')}
                    </span>
                    <Badge
                      variant={
                        flag.severity === 'critical'
                          ? 'destructive'
                          : flag.severity === 'high'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {flag.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {flag.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-Side Image Comparison if Duplicate Photo Detected */}
        {report.duplicate_match && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Perceptual Hash Image Diff (Hamming Distance: {report.duplicate_match.image_hash_distance} bits)</span>
              </div>
              <Badge variant="destructive" size="sm">
                99% Visual Match
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flagged Listing Image */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  Suspect Listing (#{report.property_id})
                </span>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-rose-500/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.duplicate_match.current_image_url}
                    alt="Current Suspect"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white">
                    Rent: {formatBDT(report.rent_bdt)} (Suspicious)
                  </div>
                </div>
              </div>

              {/* Original Listing Image */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Original Verified Listing (#{report.duplicate_match.original_property_id})
                </span>
                <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-emerald-500/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.duplicate_match.matched_image_url}
                    alt="Original Verified"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white">
                    By {report.duplicate_match.original_landlord_name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Disparity Overview */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Suspicious Stated Rent:</span>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatBDT(report.rent_bdt)}</p>
          </div>

          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400">Neighborhood Verified Average:</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatBDT(report.average_area_rent)}
            </p>
          </div>
        </div>

        {/* Resolution Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('false_positive')}
            isLoading={loading}
            className="text-xs text-slate-300"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            False Positive (Keep Active)
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('listing_banned')}
              isLoading={loading}
              className="text-xs"
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              Ban Listing Only
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('landlord_blocked')}
              isLoading={loading}
              className="text-xs font-semibold bg-rose-700 hover:bg-rose-600"
            >
              <UserX className="w-3.5 h-3.5 mr-1" />
              Ban Listing + Block Landlord
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
