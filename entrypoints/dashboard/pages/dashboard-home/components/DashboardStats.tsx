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
import { CountingNumber } from '@/components/ui/counting-number';

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
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-primary/20 transition-all duration-500 overflow-hidden">
             {/* Subtle Glow */}
            <div className="absolute -top-10 -right-10 h-20 w-20 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Runs</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]">
                    <Activity className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">
                    <CountingNumber value={analytics.totalRuns || 0} />
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">{periodLabel}</div>
            </div>
      </div>

      {/* Completed - Emerald */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-emerald-500/20 transition-all duration-500 overflow-hidden">
             <div className="absolute -top-10 -right-10 h-20 w-20 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter">
                    <CountingNumber value={analytics.successfulRuns || 0} />
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">{periodLabel}</div>
            </div>
      </div>

      {/* Failed - Red */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-red-500/20 transition-all duration-500 overflow-hidden">
             <div className="absolute -top-10 -right-10 h-20 w-20 bg-red-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Failures</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]">
                    <XCircle className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-3xl font-black text-white group-hover:text-red-400 transition-colors tracking-tighter">
                    <CountingNumber value={analytics.failed || 0} />
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">{periodLabel}</div>
            </div>
      </div>

      {/* Schedules - Primary */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-primary/20 transition-all duration-500 overflow-hidden">
             <div className="absolute -top-10 -right-10 h-20 w-20 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schedules</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(255,107,0,0.3)]">
                    <Calendar className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                    {limits?.maxSchedules === -1 
                        ? `${schedules.filter((s) => s.enabled).length} / ∞`
                        : limits?.maxSchedules
                        ? `${schedules.filter((s) => s.enabled).length}/${limits.maxSchedules}`
                        : (schedules.filter((s) => s.enabled).length > 0 ? schedules.filter((s) => s.enabled).length.toLocaleString() : '0')}
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">
                    {limits?.maxSchedules === -1 ? "Unlimited" : "Active Tasks"}
                </div>
            </div>
      </div>

      {/* Credits - Primary */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-primary/20 transition-all duration-500 overflow-hidden">
             <div className="absolute -top-10 -right-10 h-20 w-20 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(255,107,0,0.3)]">
                    <Zap className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                    {credits?.total
                        ? `${formatCompactNumber(credits.remaining ?? 0)}/${formatCompactNumber(credits.total)}`
                        : ((credits?.remaining ?? 0) > 0 ? formatCompactNumber(credits?.remaining ?? 0) : '0')}
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">Credits Balance</div>
            </div>
      </div>

      {/* Success Rate - Indigo */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative group hover:border-indigo-500/20 transition-all duration-500 overflow-hidden">
             <div className="absolute -top-10 -right-10 h-20 w-20 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]">
                    <Target className="h-4 w-4" />
                </div>
            </div>
            <div className="relative z-10 pt-2">
                <div className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter">
                    {analytics.totalRuns > 0 ? (
                        <CountingNumber value={successRate} suffix="%" />
                    ) : '-'}
                </div>
                <div className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-tighter">Success Rate</div>
            </div>
      </div>
    </div>
  );
};
