'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Calendar,
  MapPin,
  FileCheck,
} from 'lucide-react';
import type { NIDVerificationRequest } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NIDReviewModalProps {
  request: NIDVerificationRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function NIDReviewModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: NIDReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove(request.id, 'Verified via biometric face match and NID validation.');
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await onReject(request.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const isHighMatch = request.ai_face_match_confidence >= 85;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          <span>Landlord NID & Biometric Verification</span>
        </div>
      }
      description={`Reviewing verification request #${request.id} for ${request.landlord_name}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* AI Confidence Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isHighMatch
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isHighMatch
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {request.ai_face_match_confidence}% AI Biometric Match
                </span>
                <Badge variant={isHighMatch ? 'success' : 'destructive'} size="sm">
                  {isHighMatch ? 'High Confidence Pass' : 'Suspicious / Face Mismatch'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Facial landmark vectors compared between live camera selfie and Bangladesh Smart NID photo.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Media Comparison Grid */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Biometric & Document Evidence
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Selfie */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Live In-App Selfie</span>
                <Badge variant="cyan" size="sm">
                  Liveness Verified
                </Badge>
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.live_selfie_url}
                  alt="Live Selfie"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </div>

            {/* NID Front */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">NID Front (Smart Card)</span>
                <Badge variant="default" size="sm">
                  OCR Extracted
                </Badge>
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.nid_front_url}
                  alt="NID Front"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </div>

            {/* NID Back */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">NID Back</span>
                <span className="text-[10px] text-slate-500">Barcode & Address</span>
              </div>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.nid_back_url}
                  alt="NID Back"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>

        {/* OCR Extracted Data Matrix */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>OCR Data Extracted from Bangladesh Election Commission DB</span>
            </div>
            {request.extracted_data?.blood_group && (
              <Badge variant="cyan" size="sm">
                Blood Group: {request.extracted_data.blood_group}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Name (English):</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {request.extracted_data?.name_en || request.extracted_data?.name_english || request.landlord_name}
              </p>
            </div>

            <div>
              <span className="text-slate-500">Name (Bangla):</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {request.extracted_data?.name_bn || request.extracted_data?.name_bangla || 'N/A'}
              </p>
            </div>

            <div>
              <span className="text-slate-500">Father&apos;s Name:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {request.extracted_data?.father_name || 'N/A'}
              </p>
            </div>

            <div>
              <span className="text-slate-500">Date of Birth:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {request.extracted_data?.dob || request.extracted_data?.date_of_birth || 'N/A'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-500">Permanent Address:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {request.extracted_data?.address || 'Provided in NID back image'}
              </p>
            </div>
          </div>
        </div>

        {/* Reviewer Note / Rejection Section */}
        {showRejectInput ? (
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Specify Reason for Rejection / Broker Flagging</span>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Facial match score under 50%, suspicious broker phone, blurred back of NID..."
              rows={2}
              className="w-full rounded-lg border border-rose-300 dark:border-rose-500/30 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectInput(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                isLoading={actionLoading}
                disabled={!rejectReason.trim()}
                className="text-xs"
              >
                Confirm Rejection & Flag
              </Button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>

          <div className="flex items-center gap-2.5">
            {!showRejectInput && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRejectInput(true)}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject / Flag Broker
              </Button>
            )}

            <Button
              variant="emerald"
              size="sm"
              onClick={handleApprove}
              isLoading={actionLoading}
              className="font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approve Landlord NID
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
