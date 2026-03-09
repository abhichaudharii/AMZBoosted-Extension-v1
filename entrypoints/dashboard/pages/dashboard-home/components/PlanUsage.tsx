import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Zap, Calendar, ExternalLink } from 'lucide-react';
import { formatCompactNumber } from '@/entrypoints/dashboard/pages/dashboard-home/components/utils';
import { API_CONFIG } from '@/lib/api/config';

interface PlanUsageProps {
  credits: any;
  schedules: any[];
  limits: any;
}

export const PlanUsage: React.FC<PlanUsageProps> = ({ credits, schedules, limits }) => {
  return (
    <div className="bg-[#0A0A0B]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col relative">
       {/* Ambient Glow */}
       <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3 relative z-10">
        <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_-5px_rgba(255,107,0,0.3)]">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-black text-white tracking-tight">Plan Usage</h3>
      </div>

      <div className="p-6 space-y-8 relative z-10">
        {/* Credits */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Usage Credits</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white tracking-tight">
                {(credits?.total && (credits.total - (credits.remaining || 0)) < 1000)
                  ? `${(credits.total - (credits.remaining || 0)).toLocaleString()}`
                  : formatCompactNumber(credits?.total ? (credits.total - (credits.remaining || 0)) : 0)
                }
                <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                   / {formatCompactNumber(credits?.total || 0)}
                </span>
              </p>
            </div>
          </div>
          <div className="relative pt-1">
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_15px_-3px_rgba(255,107,0,0.5)] transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${credits?.total ? ((credits.total - (credits.remaining || 0)) / credits.total) * 100 : 0}%` }}
                />
             </div>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Schedules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Automation</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white tracking-tight">
                {schedules.filter(s => s.enabled).length}
                <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                   / {limits?.maxSchedules === -1 ? '∞' : limits?.maxSchedules}
                </span>
              </p>
            </div>
          </div>
          <div className="relative pt-1">
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_15px_-3px_rgba(255,107,0,0.4)] transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${limits?.maxSchedules && limits.maxSchedules > 0 
                        ? (schedules.filter(s => s.enabled).length / limits.maxSchedules) * 100 
                        : 0}%` }}
                />
             </div>
          </div>
        </div>
        
        <div className="pt-2">
           <Button 
                variant="ghost" 
                className="w-full text-[11px] h-10 border border-white/5 bg-white/[0.03] hover:bg-primary/20 hover:text-primary hover:border-primary/30 text-slate-300 font-black uppercase tracking-widest rounded-2xl transition-all" 
                onClick={() => window.open(`${API_CONFIG.dashboardURL}/dashboard/billing`, '_blank')}
            >
               Manage Subscription <ExternalLink className="ml-2 h-3.5 w-3.5" />
           </Button>
        </div>
      </div>
    </div>
  );
};
