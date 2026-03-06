import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Zap, Calendar, ExternalLink } from 'lucide-react';
import { formatCompactNumber } from '@/entrypoints/dashboard/pages/dashboard-home/components/utils';

interface PlanUsageProps {
  credits: any;
  schedules: any[];
  limits: any;
}

export const PlanUsage: React.FC<PlanUsageProps> = ({ credits, schedules, limits }) => {
  return (
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5" />
          </div>
          Plan Usage
        </div>
        <p className="text-sm text-gray-400">Current month limits and usage</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Credits */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <Zap className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Credits</p>
                <p className="text-xs text-gray-500">Monthly allocation</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {(credits?.total && (credits.total - (credits.remaining || 0)) < 1000)
                  ? `${(credits.total - (credits.remaining || 0)).toLocaleString()}`
                  : formatCompactNumber(credits?.total ? (credits.total - (credits.remaining || 0)) : 0)
                }
                <span className="text-sm font-normal text-gray-500">
                   / {formatCompactNumber(credits?.total || 0)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Credits Used
              </p>
            </div>
          </div>
          <div className="space-y-1">
             <Progress 
                value={credits?.total ? ((credits.total - (credits.remaining || 0)) / credits.total) * 100 : 0} 
                className="h-2 bg-white/5"
                indicatorClassName="bg-yellow-500"
             />
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Schedules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Active Schedules</p>
                <p className="text-xs text-gray-500">Automated tasks</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {schedules.filter(s => s.enabled).length}
                <span className="text-sm font-normal text-gray-500">
                   / {limits?.maxSchedules === -1 ? '∞' : limits?.maxSchedules}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Schedules Active
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress 
                value={limits?.maxSchedules && limits.maxSchedules > 0 
                    ? (schedules.filter(s => s.enabled).length / limits.maxSchedules) * 100 
                    : 0} 
                className="h-2 bg-white/5"
                indicatorClassName="bg-blue-500"
            />
          </div>
        </div>
        
        <div className="pt-2">
           <Button variant="outline" className="w-full text-xs h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white" onClick={() => window.open('http://localhost:8090/dashboard/billing', '_blank')}>
               Manage Plan & Limits <ExternalLink className="ml-2 h-3 w-3" />
           </Button>
        </div>
      </div>
    </div>
  );
};
