'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Flame,
  Target,
  TrendingUp,
  Download,
  Filter,
  Sparkles,
  Building,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatBDT } from '@/lib/utils';
import { DemandSupplyMap } from '@/components/maps/demand-supply-map';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DemandSupplyHeatmapPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minRatio, setMinRatio] = useState<number>(0);

  const { data: heatmapData = [], isLoading } = useQuery({
    queryKey: ['admin-heatmap-data'],
    queryFn: () => apiClient.getHeatmapData(),
  });

  // Top acquisition opportunity
  const topDeficits = [...heatmapData]
    .sort((a, b) => b.ratio_demand_supply - a.ratio_demand_supply)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dhaka Demand vs. Supply Geospatial Heatmap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phase 4: Pinpointing high-search, low-inventory neighborhoods to direct field acquisition teams.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-start">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'family', 'bachelor', 'sublet'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Demands' : cat}
              </button>
            ))}
          </div>

          <select
            value={minRatio}
            onChange={(e) => setMinRatio(Number(e.target.value))}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={0}>All Ratios</option>
            <option value={50}>High Pressure (&gt;50x)</option>
            <option value={75}>Extreme Deficit (&gt;75x)</option>
          </select>
        </div>
      </div>

      {/* Top 3 Opportunity Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topDeficits.map((spot, idx) => (
          <Card key={spot.area_id} className="glass-card border-rose-500/30 dark:border-rose-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  #1 Opportunity Priority {idx + 1}
                </span>
                <Badge variant="destructive" size="sm">
                  {spot.ratio_demand_supply}x Gap
                </Badge>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{spot.area_name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {spot.demand_searches_30d.toLocaleString()} Searches vs Only {spot.active_supply_count} Flats
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Avg Rent: {formatBDT(spot.average_rent_bdt)}
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                  +{spot.search_velocity_growth_pct}% MoM
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Heatmap */}
      <Card className="glass-card p-4">
        <DemandSupplyMap
          data={heatmapData}
          selectedCategory={selectedCategory}
          minRatio={minRatio}
        />
      </Card>

      {/* Comprehensive Neighborhood Matrix */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Neighborhood Demand Velocity & Supply Deficit Matrix</CardTitle>
              <CardDescription>
                Aggregated search telemetry vs live verified inventory across Dhaka city
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Field Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/90 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Neighborhood / Thana</th>
                  <th className="px-4 py-3 font-semibold">Tenant Searches (30d)</th>
                  <th className="px-4 py-3 font-semibold">Active Supply</th>
                  <th className="px-4 py-3 font-semibold">Pressure Ratio</th>
                  <th className="px-4 py-3 font-semibold">Median Rent</th>
                  <th className="px-4 py-3 font-semibold">Top Accommodation</th>
                  <th className="px-4 py-3 font-semibold">Market State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {heatmapData.map((area) => (
                  <tr key={area.area_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {area.area_name}
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">{area.thana} Thana</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {area.demand_searches_30d.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {area.active_supply_count} units
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          area.ratio_demand_supply > 75
                            ? 'text-rose-600 dark:text-rose-400'
                            : area.ratio_demand_supply > 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {area.ratio_demand_supply}x
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(area.average_rent_bdt)}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                      {area.top_property_type}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          area.market_pressure === 'extreme_undersupply'
                            ? 'destructive'
                            : area.market_pressure === 'high_demand'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {area.market_pressure.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
