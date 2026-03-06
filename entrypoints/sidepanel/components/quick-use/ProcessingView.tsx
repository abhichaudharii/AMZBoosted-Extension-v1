import React from 'react';
import { Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobRow } from '../../components/JobRow';
import type { JobStatus } from '../../lib/types';

interface ProcessingViewProps {
  jobs: JobStatus[];
  isPaused: boolean;
  handlePause: () => void;
  handleStop: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  jobs,
  isPaused,
  handlePause,
  handleStop
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold flex items-center gap-2">
                {isPaused ? 'Processing Paused' : 'Processing in Progress'}
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  {!isPaused && <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-yellow-500' : 'bg-primary'}`}></span>
                </span>
            </h3>
            <p className="text-xs text-muted-foreground">
                {jobs.filter(j => j.status === 'completed').length} of {jobs.length} completed
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              className="h-8 px-3 text-xs"
            >
              <Pause className="h-3.5 w-3.5 mr-1.5" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="h-8 px-3 text-xs"
            >
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Stop
            </Button>
          </div>
        </div>

        <div className="space-y-2">
            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-primary transition-all duration-500 ease-out ${isPaused ? 'opacity-50' : ''}`}
                    style={{ 
                        width: `${(jobs.filter(j => j.status === 'completed').length / jobs.length) * 100}%` 
                    }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>0%</span>
                <span>{Math.round((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100)}%</span>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-background/50 rounded-lg p-2.5 border border-border/50 text-center">
                <div className="text-lg font-bold text-foreground">
                    {jobs.filter(j => j.status === 'completed').length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Success</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2.5 border border-border/50 text-center">
                <div className="text-lg font-bold text-destructive">
                    {jobs.filter(j => j.status === 'error').length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Failed</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2.5 border border-border/50 text-center">
                <div className="text-lg font-bold text-primary">
                    {jobs.length - jobs.filter(j => j.status === 'completed' || j.status === 'error').length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Remaining</div>
            </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Queue</h4>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
            ))}
        </div>
      </div>
    </div>
  );
};
