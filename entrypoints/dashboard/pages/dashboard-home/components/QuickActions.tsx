import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Play, FileText, Clock, Plug } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/10 hover:shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)] group">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="text-base font-bold text-white">Quick Actions</h3>
      </div>
      <div className="p-5">
        <div className="grid gap-3 grid-cols-1">
          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-2.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/tools')}
          >
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover/btn:bg-blue-500/20 transition-colors">
              <Play className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Run a Tool</span>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-2.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/reports')}
          >
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 group-hover/btn:bg-purple-500/20 transition-colors">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">View Reports</span>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-2.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/schedules')}
          >
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover/btn:bg-indigo-500/20 transition-colors">
              <Clock className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Schedule Task</span>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-3 h-auto py-2.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/integrations')}
          >
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover/btn:bg-amber-500/20 transition-colors">
              <Plug className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Add Integration</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
