import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  tasks: any[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ tasks }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0A0A0B]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col relative">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_-5px_rgba(255,107,0,0.3)]">
            <Activity className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Recent Activity</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/activity')}
          className="text-xs h-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold px-4"
        >
          View All
        </Button>
      </div>

      <div className="flex-1 overflow-hidden relative z-10">
        {tasks.length > 0 ? (
          <div className="divide-y divide-white/5">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="px-6 py-4 hover:bg-white/[0.03] transition-all cursor-pointer group/item relative overflow-hidden"
                onClick={() => navigate('/activity')}
              >
                {/* Ambient Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className="mt-0.5">
                    {task.status === 'completed' ? (
                      <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    ) : task.status === 'failed' ? (
                      <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_-5px_rgba(255,107,0,0.3)]">
                        <Clock className={cn("h-5 w-5 text-primary", task.status === 'processing' && "animate-pulse")} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-white truncate group-hover/item:text-primary transition-colors duration-300 tracking-tight">
                            {task.toolName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {task.marketplace}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {task.urlCount} TARGET{task.urlCount !== 1 ? 'S' : ''}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] h-5 px-2 border font-black tracking-widest rounded-lg transition-all",
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          task.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                          'bg-primary/10 text-primary border-primary/30'
                        )}
                      >
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-600" />
                            {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-72 text-center p-8 relative z-10">
            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Activity className="h-8 w-8 text-slate-700" />
            </div>
            <p className="text-base font-bold text-slate-400">No activity logged yet</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Run your first automation to see results here.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 border-white/10 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 text-white rounded-xl px-6 h-9 transition-all"
              onClick={() => navigate('/tools')}
            >
              Launch Tool
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
