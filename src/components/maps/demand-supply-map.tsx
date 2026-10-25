'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {
  MapPin,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Layers,
  Flame,
  Building,
  Target,
  Key,
} from 'lucide-react';
import type { HeatmapAreaPoint } from '@/lib/types';
import { formatBDT } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_CONFIG } from '@/lib/api-config';

interface DemandSupplyMapProps {
  data: HeatmapAreaPoint[];
  selectedCategory?: string;
  minRatio?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '560px',
  borderRadius: '1rem',
};

const defaultCenter = {
  lat: 23.795,
  lng: 90.405, // Dhaka Central
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#17202e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#17202e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2b394d' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0d131f' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
  ],
};

const libraries: ('places' | 'visualization')[] = ['visualization'];

export function DemandSupplyMap({
  data,
  selectedCategory = 'all',
  minRatio = 0,
}: DemandSupplyMapProps) {
  const [activeArea, setActiveArea] = useState<HeatmapAreaPoint | null>(null);
  const [viewMode, setViewMode] = useState<'gap' | 'demand' | 'supply'>('gap');

  const apiKey = API_CONFIG.googleMapsApiKey;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return data.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.top_property_type === selectedCategory;
      const matchRatio = item.ratio_demand_supply >= minRatio;
      return matchCat && matchRatio;
    });
  }, [data, selectedCategory, minRatio]);

  // Marker icon generator
  const getMarkerIcon = useCallback(
    (item: HeatmapAreaPoint) => {
      let pinColor = '#10b981'; // green for balanced
      if (item.market_pressure === 'extreme_undersupply') pinColor = '#f43f5e'; // rose/red
      if (item.market_pressure === 'high_demand') pinColor = '#f59e0b'; // amber

      if (typeof window === 'undefined' || !window.google) return undefined;

      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 0.9,
        scale: Math.max(10, Math.min(22, item.ratio_demand_supply / 6)),
        strokeColor: '#ffffff',
        strokeWeight: 2,
      };
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Map Control Layer Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Heatmap Layer:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('gap')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'gap'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Target className="w-3 h-3 inline mr-1" />
              Opportunity Gap (Undersupply)
            </button>

            <button
              onClick={() => setViewMode('demand')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'demand'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Flame className="w-3 h-3 inline mr-1" />
              Tenant Demand (Searches)
            </button>

            <button
              onClick={() => setViewMode('supply')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'supply'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Building className="w-3 h-3 inline mr-1" />
              Active Flat Inventory
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Extreme Undersupply (&gt;75x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>High Demand (50-75x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Balanced (&lt;50x)</span>
          </div>
        </div>
      </div>

      {/* Map Rendering Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
        {apiKey && isLoaded && !loadError ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            options={mapOptions}
          >
            {filteredAreas.map((area) => (
              <Marker
                key={area.area_id}
                position={area.coordinates}
                onClick={() => setActiveArea(area)}
                icon={getMarkerIcon(area)}
              />
            ))}

            {activeArea && (
              <InfoWindow
                position={activeArea.coordinates}
                onCloseClick={() => setActiveArea(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs">
                  <h4 className="font-bold text-sm text-slate-900">{activeArea.area_name}</h4>
                  <p className="text-xs text-slate-600 mb-2">Thana: {activeArea.thana}</p>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">30d Searches:</span>
                      <span className="font-bold">
                        {activeArea.demand_searches_30d.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Supply:</span>
                      <span className="font-bold">{activeArea.active_supply_count} flats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Demand/Supply Ratio:</span>
                      <span className="font-bold text-rose-600">
                        {activeArea.ratio_demand_supply}x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Rent:</span>
                      <span className="font-bold text-emerald-700">
                        {formatBDT(activeArea.average_rent_bdt)}
                      </span>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          /* Interactive High-Fidelity Geospatial Radar Canvas (Fallback when Google Maps API key is not configured) */
          <div className="relative w-full h-[560px] bg-slate-100 dark:bg-slate-950 p-6 flex flex-col justify-between overflow-hidden transition-colors">
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#0ea5e9 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px',
              }}
            />

            {/* Top API Key Info Banner */}
            <div className="relative z-10 flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Interactive Geospatial Simulation Active
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    To load Google Maps JavaScript satellite tiles, set{' '}
                    <code className="text-emerald-700 dark:text-emerald-300 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{' '}
                    <code className="text-slate-700 dark:text-slate-300 font-mono">.env.local</code>.
                  </p>
                </div>
              </div>
              <Badge variant="cyan" size="sm">
                Interactive Heatmap Pins Active
              </Badge>
            </div>

            {/* Dhaka Visual Geospatial Nodes Canvas */}
            <div className="relative z-10 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 overflow-y-auto">
              {filteredAreas.map((area) => {
                const isSelected = activeArea?.area_id === area.area_id;
                const isExtreme = area.market_pressure === 'extreme_undersupply';
                const isHigh = area.market_pressure === 'high_demand';

                return (
                  <div
                    key={area.area_id}
                    onClick={() => setActiveArea(area)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-slate-800/90 border-emerald-500 dark:border-emerald-400 shadow-md scale-[1.02]'
                        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isExtreme ? 'bg-rose-500 animate-pulse' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {area.area_name}
                        </h4>
                      </div>
                      <Badge
                        variant={isExtreme ? 'destructive' : isHigh ? 'warning' : 'success'}
                        size="sm"
                      >
                        {area.ratio_demand_supply}x Gap
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <div>
                        <span>Demand:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {area.demand_searches_30d.toLocaleString()} searches
                        </p>
                      </div>
                      <div>
                        <span>Supply:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {area.active_supply_count} flats
                        </p>
                      </div>
                      <div>
                        <span>Median Rent:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatBDT(area.average_rent_bdt)}
                        </p>
                      </div>
                      <div>
                        <span>Growth 30d:</span>
                        <p className="font-bold text-cyan-600 dark:text-cyan-400">
                          +{area.search_velocity_growth_pct}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Target Recommendation */}
            {activeArea && (
              <div className="relative z-10 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 backdrop-blur-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Field Acquisition Target: {activeArea.area_name}
                    </span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80">
                      High deficit detected! Operations team should deploy landlord onboarding
                      agents here for {activeArea.top_property_type} flats.
                    </p>
                  </div>
                </div>
                <Button variant="emerald" size="sm" className="text-xs">
                  Export Landlord Lead Target
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
