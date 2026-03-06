import React from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Zap,
  Target,
  XCircle,
} from 'lucide-react';
import { formatCompactNumber } from '@/entrypoints/dashboard/pages/dashboard-home/components/utils';

interface DashboardStatsProps {
  analytics: any;
  schedules: any[];
  limits: any;
  credits: any;
  successRate: number;
  periodLabel: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  analytics,
  schedules,
  limits,
  credits,
  successRate,
  periodLabel,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Runs - Blue */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Runs</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Activity className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {analytics.totalRuns > 0 ? analytics.totalRuns.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{periodLabel}</div>
      </div>

      {/* Completed - Emerald */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Completed</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {analytics.successfulRuns > 0 ? analytics.successfulRuns.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{periodLabel}</div>
      </div>

      {/* Failed - Red */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Failed</span>
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                    <XCircle className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {analytics.failed > 0 ? analytics.failed.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{periodLabel}</div>
      </div>

      {/* Schedules - Purple */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Schedules</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Calendar className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {limits?.maxSchedules === -1 
                    ? `${schedules.filter((s) => s.enabled).length} / ∞`
                    : limits?.maxSchedules
                    ? `${schedules.filter((s) => s.enabled).length}/${limits.maxSchedules}`
                    : (schedules.filter((s) => s.enabled).length > 0 ? schedules.filter((s) => s.enabled).length.toLocaleString() : '0')}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
                {limits?.maxSchedules === -1 ? "Unlimited active" : "Active schedules"}
            </div>
      </div>

      {/* Credits - Yellow/Amber */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</span>
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <Zap className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {credits?.total
                    ? `${formatCompactNumber(credits.remaining ?? 0)}/${formatCompactNumber(credits.total)}`
                    : ((credits?.remaining ?? 0) > 0 ? formatCompactNumber(credits?.remaining ?? 0) : '0')}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">Monthly credits</div>
      </div>

      {/* Success Rate - Orange */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Success Rate</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                    <Target className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {analytics.totalRuns > 0 ? `${successRate}%` : '-'}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{periodLabel}</div>
      </div>
    </div>
  );
};
