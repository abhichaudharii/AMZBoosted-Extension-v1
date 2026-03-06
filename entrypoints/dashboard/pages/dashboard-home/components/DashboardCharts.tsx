import React from 'react';
import { AreaChart, BarChart } from '@/components/charts';
import { Activity, BarChart3 } from 'lucide-react';

interface DashboardChartsProps {
  analytics: any;
  periodLabel: string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analytics, periodLabel }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group">
        <div className="p-6 border-b border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
            </div>
            Activity Trend
          </div>
          <p className="text-sm text-gray-400">Tool runs for {periodLabel.toLowerCase()}</p>
        </div>
        <div className="p-6">
          {analytics?.dailyStats && analytics.dailyStats.length > 0 && analytics.dailyStats.some((d: any) => d.totalRuns > 0) ? (
            <AreaChart
              data={analytics.dailyStats}
              xAxisKey="date"
              areas={[
                { dataKey: 'totalRuns', stroke: '#3b82f6', fill: 'url(#colorTotal)', name: 'Total Runs' },
                { dataKey: 'successfulRuns', stroke: '#10b981', fill: 'url(#colorSuccess)', name: 'Successful' },
              ]}
              height={280}
            />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-sm text-muted-foreground">
              <Activity className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No activity data available</p>
              <p className="text-xs mt-1 text-gray-600">Run a tool to see your activity trend</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group">
        <div className="p-6 border-b border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
             <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
             </div>
            Marketplace Distribution
          </div>
          <p className="text-sm text-gray-400">Runs by marketplace for {periodLabel.toLowerCase()}</p>
        </div>
        <div className="p-6">
          {analytics?.marketplaceBreakdown && analytics.marketplaceBreakdown.length > 0 ? (
            <BarChart
              data={analytics.marketplaceBreakdown}
              xAxisKey="marketplace"
              bars={[{ dataKey: 'count', fill: '#8b5cf6', name: 'Runs' }]}
              height={280}
            />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-sm text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No marketplace data available</p>
              <p className="text-xs mt-1 text-gray-600">Run a tool to see marketplace distribution</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
