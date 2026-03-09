import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingSchedulesProps {
  schedules: any[];
}

export const UpcomingSchedules: React.FC<UpcomingSchedulesProps> = ({ schedules }) => {
  const navigate = useNavigate();

  const upcomingSchedules = schedules.slice(0, 5).map((schedule) => ({
    id: schedule.id,
    name: schedule.name,
    tool: schedule.toolName || schedule.toolId,
    nextRun: new Date(schedule.nextRunAt || new Date()),
    frequency: schedule.frequency,
    enabled: schedule.enabled,
  }));

  return (
    <div className="bg-[#0A0A0B]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col relative">
       {/* Ambient Glow */}
       <div className="absolute top-1/2 -left-12 h-24 w-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_-5px_rgba(255,107,0,0.3)]">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">Upcoming Tasks</h3>
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/schedules')}
             className="text-xs h-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold px-4"
        >
            View All
        </Button>
      </div>

      <div className="flex-1 overflow-hidden relative z-10">
        {upcomingSchedules.length > 0 ? (
          <div className="divide-y divide-white/5">
            {upcomingSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="px-6 py-4 hover:bg-white/[0.03] transition-all group/item relative overflow-hidden"
              >
                {/* Subtle side highlight */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 opacity-0 group-hover/item:opacity-100",
                    schedule.enabled ? "bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-500"
                )} />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                       <div className={cn(
                           "h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                           schedule.enabled ? "bg-emerald-500 shadow-emerald-500/50" : "bg-slate-500 shadow-slate-500/50"
                       )} />
                      <p className="text-[14px] font-bold text-white truncate group-hover/item:text-primary transition-colors duration-300 tracking-tight">
                        {schedule.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 mt-2 pl-4">
                      <Badge variant="outline" className="text-[9px] h-5 bg-white/5 text-slate-400 border-white/10 font-black uppercase tracking-widest px-2 group-hover/item:bg-white/10 transition-colors">
                        {schedule.frequency}
                      </Badge>
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 underline decoration-primary/20 decoration-2 underline-offset-4">
                        <Clock className="h-3 w-3 text-primary/60" />
                        {format(schedule.nextRun, 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-600 bg-white/5 hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30 transition-all duration-300" disabled>
                     <Play className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-72 text-center p-8 relative z-10">
            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Clock className="h-8 w-8 text-slate-700" />
            </div>
            <p className="text-base font-bold text-slate-400">No tasks on the radar</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Create a schedule to automate your Seller Central workflow.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 border-white/10 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 text-white rounded-xl px-6 h-9 transition-all"
              onClick={() => navigate('/schedules')}
            >
              Add Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
