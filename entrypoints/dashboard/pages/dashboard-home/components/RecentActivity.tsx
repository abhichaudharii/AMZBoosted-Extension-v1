import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface RecentActivityProps {
  tasks: any[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ tasks }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 text-lg font-bold text-white">
              <div className="p-1.5 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              Recent Activity
            </div>
            <p className="text-sm text-gray-400 mt-1">Latest task executions</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/activity')}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          View All
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tasks.length > 0 ? (
          <div className="divide-y divide-white/5">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate('/activity')}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {task.status === 'completed' ? (
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    ) : task.status === 'failed' ? (
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    ) : task.status === 'processing' ? (
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-[#FF6B00] transition-colors">{task.toolName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {task.marketplace}
                          </span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">
                            {task.urlCount} URL{task.urlCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-2 border-transparent ${
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                          'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                      {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <Activity className="h-12 w-12 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-500">No recent activity</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => navigate('/tools')}
            >
              Run a Tool
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
