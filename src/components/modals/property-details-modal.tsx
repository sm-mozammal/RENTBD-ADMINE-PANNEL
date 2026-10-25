'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Sparkles,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Flame,
  Zap,
  Car,
  Wifi,
  Shield,
  Eye,
  Calendar,
  Compass,
  FileText,
  Lock,
  Camera,
  Star,
  Droplets,
  Navigation,
} from 'lucide-react';
import type { Property, PropertyStatus } from '@/lib/types';
import { formatBDT } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api-client';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: PropertyStatus, notes?: string) => Promise<void>;
}

export function PropertyDetailsModal({
  property,
  isOpen,
  onClose,
  onUpdateStatus,
}: PropertyDetailsModalProps) {
  const { toast } = useToast();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [moderatorNote, setModeratorNote] = useState('');
  const [loadingAction, setLoadingAction] = useState<PropertyStatus | null>(null);

  // Reset active photo index and moderator note whenever property changes
  useEffect(() => {
    setActivePhotoIdx(0);
    setCopiedPhone(false);
    setModeratorNote(property?.moderation_notes || property?.rejection_reason || '');
  }, [property?.id, isOpen]);

  if (!property) return null;

  const rawPhotos = property.photos && property.photos.length > 0 ? property.photos : [];
  const photos = rawPhotos.map(normalizeImageUrl).filter(Boolean);
  const hasPhotos = photos.length > 0;

  const currentPhotoUrl = hasPhotos ? photos[activePhotoIdx] || photos[0] : '';
  const currentPhotoDetail = property.photo_details?.[activePhotoIdx];

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleCopyPhone = () => {
    if (!property.landlord.phone) return;
    navigator.clipboard.writeText(property.landlord.phone);
    setCopiedPhone(true);
    toast.success('Phone number copied to clipboard', property.landlord.phone);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    setLoadingAction(newStatus);
    try {
      await onUpdateStatus(property.id, newStatus, moderatorNote.trim() || undefined);
      if (newStatus === 'active') {
        toast.success('Listing Approved & Published', `"${property.title}" is now active in search.`);
      } else if (newStatus === 'rejected') {
        toast.warning('Listing Rejected', `"${property.title}" has been set to rejected.`);
      } else if (newStatus === 'flagged_spam') {
        toast.error('Listing Flagged as Spam', `"${property.title}" sent to Spam Queue.`);
      }
      onClose();
    } catch (err: any) {
      toast.error('Failed to update property status', err?.message || 'Server error');
    } finally {
      setLoadingAction(null);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.coordinates.lat},${property.coordinates.lng}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-500" />
          <span className="font-bold">Property Moderation & Inspection</span>
        </div>
      }
      description={
        <span className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span>Listing #{property.id}</span>
          <span>•</span>
          <span>{property.thana}, {property.district}</span>
          {property.is_vaulted && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                <Lock className="w-3 h-3" /> Off-Market Vault
              </span>
            </>
          )}
        </span>
      }
      maxWidth="5xl"
    >
      <div className="space-y-6 pb-2">
        {/* =========================================================================
            1. PHOTO GALLERY (Hero preview with tags, counter, EXIF & thumbnail strip)
           ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Property Photos from API</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {photos.length} {photos.length === 1 ? 'image' : 'images'}
              </span>
            </span>

            {hasPhotos && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Photo {activePhotoIdx + 1} of {photos.length}
                </span>
                <a
                  href={currentPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <span>View Full HD</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {hasPhotos ? (
            <>
              {/* Main Hero Photo Viewport */}
              <div className="relative aspect-[16/9] sm:aspect-[16/8] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center group shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentPhotoUrl}
                  src={currentPhotoUrl}
                  alt={`${property.title} - Photo ${activePhotoIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('unsplash')) {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
                    }
                  }}
                />

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                  {currentPhotoDetail?.tag && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-sm">
                      {currentPhotoDetail.tag.replace('_', ' ')}
                    </span>
                  )}
                  {currentPhotoDetail?.is_cover && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-slate-950 shadow-sm">
                      Cover Photo
                    </span>
                  )}
                  {(property.has_geo_verified_photo || currentPhotoDetail?.has_exif_gps) && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/95 text-white flex items-center gap-1 shadow-sm backdrop-blur-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Geo-Verified EXIF
                    </span>
                  )}
                </div>

                {/* Next / Previous Controls */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-lg border border-white/20 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-lg border border-white/20 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Gradient with current URL path info */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent flex items-center justify-between text-[11px] text-white/90">
                  <span className="truncate max-w-md font-mono text-[10px] text-slate-300">
                    {currentPhotoUrl}
                  </span>
                  <span className="shrink-0 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] border border-white/10">
                    API Source
                  </span>
                </div>
              </div>

              {/* Thumbnail Carousel Strip */}
              {photos.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
                  {photos.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border transition-all ${
                        activePhotoIdx === idx
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105 shadow-md'
                          : 'border-slate-300 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (!e.currentTarget.src.includes('unsplash')) {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100';
                          }
                        }}
                      />
                      {property.photo_details?.[idx]?.tag && (
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-[8px] font-bold text-white text-center truncate px-0.5">
                          {property.photo_details[idx].tag.replace('_', ' ')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[16/7] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
              <Camera className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Photos Uploaded by Landlord
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                This listing was submitted without uploaded room images or geo-tagged photos.
              </p>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. HEADER & PRICING BAR
           ========================================================================= */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan" size="sm" className="capitalize font-semibold">
                {property.category}
              </Badge>
              {property.property_type && (
                <Badge variant="secondary" size="sm" className="font-semibold">
                  {property.property_type}
                </Badge>
              )}
              <Badge
                variant={
                  property.status === 'active'
                    ? 'success'
                    : property.status === 'flagged_spam' || property.status === 'rejected'
                    ? 'destructive'
                    : 'warning'
                }
                size="sm"
                className="font-bold uppercase tracking-wider"
              >
                {property.status.replace('_', ' ')}
              </Badge>
              {property.is_available ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available for Rent
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500">Occupied / Closed</span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {property.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {property.address}
              </span>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Pricing Overview Box */}
          <div className="md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6 shrink-0 flex flex-row md:flex-col justify-between items-end gap-1">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monthly Rent</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                {formatBDT(property.rent_bdt)}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
              <p>+ {formatBDT(property.service_charge_bdt)} service charge</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Total Est: {formatBDT(property.total_monthly_est || (property.rent_bdt + property.service_charge_bdt))}/mo
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. FINANCIAL BREAKDOWN GRID
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Monthly Rent</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatBDT(property.rent_bdt)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Service Charge</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatBDT(property.service_charge_bdt)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Security Deposit</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatBDT(property.advance_deposit_bdt)}
            </p>
          </div>

          {property.estimated_utilities_bdt !== undefined && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Est. Utilities</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {formatBDT(property.estimated_utilities_bdt)}
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">
              {property.total_move_in_cost_bdt ? 'Total Move-in Cost' : 'Total Monthly Outflow'}
            </span>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              {formatBDT(property.total_move_in_cost_bdt || property.total_monthly_est || (property.rent_bdt + property.service_charge_bdt))}
            </p>
          </div>
        </div>

        {/* =========================================================================
            4. KEY PHYSICAL SPECIFICATIONS GRID
           ========================================================================= */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 block">
            Property Specifications from API
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Bed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Bedrooms</span>
                <p className="font-bold text-slate-900 dark:text-white">{property.bedrooms} Bed</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Bath className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Bathrooms</span>
                <p className="font-bold text-slate-900 dark:text-white">{property.bathrooms} Bath</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Balconies</span>
                <p className="font-bold text-slate-900 dark:text-white">{property.balconies} Balcony</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Floor Area</span>
                <p className="font-bold text-slate-900 dark:text-white">{property.size_sqft} sqft</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Floor Level</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {property.floor_level}th Floor
                  {property.total_floors ? ` of ${property.total_floors}` : ''}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Category</span>
                <p className="font-bold text-slate-900 dark:text-white capitalize">{property.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. FULL PROPERTY DESCRIPTION (from API)
           ========================================================================= */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Property Description (from API)
            </span>
            {property.ai_description_generated && (
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {property.description || 'No detailed description provided by the landlord for this property.'}
          </p>
        </div>

        {/* =========================================================================
            6. AMENITIES & BUILDING FACILITIES
           ========================================================================= */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Amenities & Verified Features ({property.amenities.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity, idx) => {
              const lower = amenity.toLowerCase();
              return (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  {lower.includes('gas') && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                  {lower.includes('generator') && <Zap className="w-3.5 h-3.5 text-yellow-500" />}
                  {lower.includes('parking') && <Car className="w-3.5 h-3.5 text-blue-500" />}
                  {lower.includes('wifi') && <Wifi className="w-3.5 h-3.5 text-indigo-500" />}
                  {lower.includes('security') || lower.includes('cctv') ? (
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  ) : null}
                  {lower.includes('lift') && <Building2 className="w-3.5 h-3.5 text-teal-500" />}
                  <span>{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            6b. URBAN LIVABILITY & NEIGHBORHOOD INFRASTRUCTURE (API Telemetry)
           ========================================================================= */}
        {(property.gas_supply || property.alley_width_feet != null || property.waterlogging_risk || property.water_quality || property.night_safety_rating != null) && (
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Urban Livability & Neighborhood Index (API Verified)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {property.gas_supply && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gas Supply</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white capitalize">
                    {property.gas_supply.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              )}

              {property.alley_width_feet != null && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>Access Road</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {property.alley_width_feet} ft wide
                  </p>
                </div>
              )}

              {property.water_quality && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Water Quality</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white capitalize">
                    {property.water_quality.toLowerCase()}
                  </p>
                </div>
              )}

              {property.waterlogging_risk && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-teal-500" />
                    <span>Waterlogging</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white capitalize">
                    {property.waterlogging_risk.toLowerCase()} risk
                  </p>
                </div>
              )}

              {property.night_safety_rating != null && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Night Safety</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {property.night_safety_rating} / 5.0
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            7. AI FAIR RENT METER & GEO EXIF TELEMETRY (2 Columns)
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Fair Rent Meter Card */}
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  AI Fair Rent Meter™
                </span>
              </div>
              <Badge
                variant={
                  property.fair_price_meter.status === 'Overpriced'
                    ? 'destructive'
                    : property.fair_price_meter.status === 'Great Deal'
                    ? 'cyan'
                    : 'success'
                }
                size="sm"
              >
                {property.fair_price_meter.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">AI Estimated Fair</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatBDT(property.fair_price_meter.estimated_fair_rent)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Market Diff</span>
                <p
                  className={`font-bold mt-0.5 ${
                    property.fair_price_meter.difference_percentage > 15
                      ? 'text-rose-600 dark:text-rose-400'
                      : property.fair_price_meter.difference_percentage < -10
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {property.fair_price_meter.difference_percentage > 0 ? '+' : ''}
                  {property.fair_price_meter.difference_percentage}%
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Area Median</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  ৳{property.fair_price_meter.market_average_per_sqft}/sqft
                </p>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              Calculated using geospatial spatial interpolation across verified rentals in {property.thana}.
            </p>
          </div>

          {/* Geo-Location & EXIF Verification Card */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Geospatial Coordinates & EXIF
                </span>
              </div>
              {property.has_geo_verified_photo ? (
                <Badge variant="success" size="sm">
                  <ShieldCheck className="w-3 h-3" /> Verified GPS
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm">
                  Pending GPS Match
                </Badge>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Latitude & Longitude:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {property.coordinates.lat.toFixed(5)}, {property.coordinates.lng.toFixed(5)}
                </span>
              </div>

              {property.geo_tagged_photo && (
                <>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>EXIF Distance Discrepancy:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {property.geo_tagged_photo.distance_discrepancy_meters} meters
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>GPS Telemetry Accuracy:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      ± {property.geo_tagged_photo.accuracy_meters}m
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                <span>Map Verification:</span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            8. LANDLORD / OWNER VERIFICATION PROFILE
           ========================================================================= */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-base">
              {property.landlord.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {property.landlord.name}
                </span>
                {property.landlord.rating != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{property.landlord.rating.toFixed(1)}</span>
                  </span>
                )}
                {property.landlord.is_nid_verified ? (
                  <Badge variant="success" size="sm">
                    <ShieldCheck className="w-3 h-3" />
                    NID Verified Owner
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm">
                    NID Unverified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Landlord ID: {property.landlord.id} {property.landlord.email ? `• ${property.landlord.email}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={`tel:${property.landlord.phone}`}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{property.landlord.phone}</span>
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPhone}
              className="text-xs"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* =========================================================================
            9. MODERATOR REVIEW NOTES & ACTION BAR
           ========================================================================= */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label
              htmlFor="moderator-note"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1"
            >
              Moderator Reviewer Notes / Rejection Reason (Saved to API):
            </label>
            <input
              id="moderator-note"
              type="text"
              value={moderatorNote}
              onChange={(e) => setModeratorNote(e.target.value)}
              placeholder="e.g., Verified line gas connection, approved photos, price within reasonable bounds..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loadingAction !== null}
            >
              Close
            </Button>

            <div className="flex flex-wrap items-center gap-2.5">
              {property.status !== 'rejected' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusChange('rejected')}
                  isLoading={loadingAction === 'rejected'}
                  disabled={loadingAction !== null}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject Listing
                </Button>
              )}

              {property.status !== 'flagged_spam' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                  onClick={() => handleStatusChange('flagged_spam')}
                  isLoading={loadingAction === 'flagged_spam'}
                  disabled={loadingAction !== null}
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Flag as Spam
                </Button>
              )}

              {property.status !== 'active' && (
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  isLoading={loadingAction === 'active'}
                  disabled={loadingAction !== null}
                  className="font-bold shadow-md"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve & Publish Listing
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
