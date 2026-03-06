import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play } from 'lucide-react';

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
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 text-lg font-bold text-white">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              Upcoming Tasks
            </div>
            <p className="text-sm text-gray-400 mt-1">Scheduled for next 24 hours</p>
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/schedules')}
             className="text-gray-400 hover:text-white hover:bg-white/5"
        >
            View All
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {upcomingSchedules.length > 0 ? (
          <div className="divide-y divide-white/5">
            {upcomingSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 hover:bg-white/5 transition-colors group/item"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <div className={`h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-[#1A1A1C] ${schedule.enabled ? 'bg-emerald-500 ring-emerald-500/30' : 'bg-gray-500 ring-gray-500/30'}`} />
                      <p className="text-sm font-bold text-white truncate group-hover/item:text-indigo-400 transition-colors">{schedule.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 pl-4">
                      <Badge variant="secondary" className="text-[10px] h-5 bg-white/5 text-gray-400 hover:bg-white/10">
                        {schedule.frequency}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(schedule.nextRun, 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 bg-white/5 hover:bg-white/10" disabled>
                     <Play className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <Clock className="h-12 w-12 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-500">No upcoming tasks</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => navigate('/schedules')}
            >
              Create Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
