'use client';

import React, { useState } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, AlertTriangle, Compass } from 'lucide-react';
import type { GeoPhotoVerificationRequest } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GeoPhotoModalProps {
  request: GeoPhotoVerificationRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (id: string, approved: boolean) => Promise<void>;
}

export function GeoPhotoModal({
  request,
  isOpen,
  onClose,
  onVerify,
}: GeoPhotoModalProps) {
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const isAcceptable = request.distance_difference_meters <= 50;

  const handleAction = async (approved: boolean) => {
    setLoading(true);
    try {
      await onVerify(request.id, approved);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          <span>Geo-Tagged Live Photo Validation</span>
        </div>
      }
      description={`Validating live in-app camera capture for: ${request.property_title}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Discrepancy Status Alert */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isAcceptable
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-500/30 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAcceptable ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  GPS Offset: {request.distance_difference_meters} meters
                </span>
                <Badge variant={isAcceptable ? 'success' : 'destructive'} size="sm">
                  {isAcceptable ? 'Accurate On-Site Capture' : 'Severe Location Mismatch'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {isAcceptable
                  ? 'Camera EXIF metadata matches registered building coordinates within standard GPS tolerance (±50m).'
                  : `Discrepancy of ${request.distance_difference_meters}m indicates photo was likely taken off-site or uploaded from a recycled gallery.`}
              </p>
            </div>
          </div>
        </div>

        {/* Photo and Coordinates Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Captured Live Photo */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
              Captured In-App Photo
            </span>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 relative aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={request.photo_url}
                alt="Geo tagged flat"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/10">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Live Camera Timestamp
              </div>
            </div>
          </div>

          {/* Coordinates Details */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Geospatial Coordinates
            </span>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Property Address Coordinates:</span>
              </div>
              <p className="font-mono text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 p-2 rounded border border-emerald-200 dark:border-emerald-500/20">
                Lat: {request.property_coordinates.lat.toFixed(5)}, Lng:{' '}
                {request.property_coordinates.lng.toFixed(5)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                {request.property_coordinates.address}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Camera EXIF Coordinates:</span>
              </div>
              <p className="font-mono text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/30 p-2 rounded border border-cyan-200 dark:border-cyan-500/20">
                Lat: {request.exif_coordinates.lat.toFixed(5)}, Lng:{' '}
                {request.exif_coordinates.lng.toFixed(5)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                GPS Accuracy Radius: ±{request.accuracy_meters}m
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Close
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction(false)}
              isLoading={loading}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Reject & Remove Badge
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleAction(true)}
              isLoading={loading}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Grant &quot;Verified Real Photo&quot; Badge
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
