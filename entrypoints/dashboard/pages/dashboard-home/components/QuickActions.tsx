import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, Play, FileText, Clock, Plug } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group">
      <div className="p-6 border-b border-white/5 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5" />
          </div>
          Quick Actions
        </div>
        <p className="text-sm text-gray-400">Common tasks and shortcuts to boost your productivity</p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="justify-start gap-4 h-auto py-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/tools')}
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover/btn:bg-blue-500/20 transition-colors">
              <Play className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Run a Tool</div>
              <div className="text-xs text-gray-400">Start new extraction</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-4 h-auto py-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/reports')}
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover/btn:bg-purple-500/20 transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">View Reports</div>
              <div className="text-xs text-gray-400">Browse all reports</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-4 h-auto py-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/schedules')}
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover/btn:bg-indigo-500/20 transition-colors">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Schedule Task</div>
              <div className="text-xs text-gray-400">Automate extractions</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-4 h-auto py-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-white transition-all group/btn"
            onClick={() => navigate('/integrations')}
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover/btn:bg-amber-500/20 transition-colors">
              <Plug className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Connect Integration</div>
              <div className="text-xs text-gray-400">Link external tools</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
