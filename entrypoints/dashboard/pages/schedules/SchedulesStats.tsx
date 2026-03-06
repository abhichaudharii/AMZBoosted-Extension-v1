import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { UISchedule } from './useSchedulesLogic';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SchedulesStatsProps {
    schedules: UISchedule[];
}

export const SchedulesStats: React.FC<SchedulesStatsProps> = ({ schedules }) => {
    const total = schedules.length;
    const active = schedules.filter(s => s.enabled).length;
    const paused = schedules.filter(s => !s.enabled).length;
    
    // Logic for Next Running Schedule
    // We prioritize the earliest scheduled run, even if it's overdue (in the past), as it will be the next one processed.
    const nextRunSchedule = schedules
        .filter(s => s.enabled && s.nextRun)
        .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PremiumStatCard 
                title="Total Schedules" 
                value={total} 
                icon={CheckCircle2} 
                colorClass="text-blue-500" 
                bgClass="bg-blue-500/10" 
            />
            <PremiumStatCard 
                title="Active" 
                value={active} 
                icon={Play} 
                colorClass="text-emerald-500" 
                bgClass="bg-emerald-500/10" 
            />
            <PremiumStatCard 
                title="Paused" 
                value={paused} 
                icon={Pause} 
                colorClass="text-yellow-500" 
                bgClass="bg-yellow-500/10" 
            />
            <PremiumStatCard 
                title="Next Run" 
                value={nextRunSchedule?.nextRun ? format(new Date(nextRunSchedule.nextRun), 'HH:mm') : '-'}
                icon={Clock}
                colorClass="text-purple-500"
                bgClass="bg-purple-500/10"
            />
        </div>
    );
};

function PremiumStatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: any) {
  return (
      <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border-white/5 overflow-hidden relative group hover:border-white/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {title}
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg transition-colors", bgClass, colorClass)}>
                  <Icon className="h-4 w-4" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-1">
                 <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                  {value}
                 </div>
                 {subtitle && (
                   <div className="text-xs text-gray-500 font-mono">
                     {subtitle}
                   </div>
                 )}
              </div>
          </CardContent>
      </Card>
  );
}
