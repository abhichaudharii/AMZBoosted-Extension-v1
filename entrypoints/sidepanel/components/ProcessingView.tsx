import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Square, CheckCircle2, XCircle, Clock, Sparkles, Loader2 } from 'lucide-react';
import { JobRow } from './JobRow';
import { JobStatus } from '../lib/types';

interface ProcessingViewProps {
  jobs: JobStatus[];
  isPaused: boolean;
  onPause: () => void;
  onStop: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  jobs,
  onStop,
}) => {
  const completed = jobs.filter(j => j.status === 'completed').length;
  const failed = jobs.filter(j => j.status === 'error').length;
  const total = jobs.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const remaining = total - completed - failed;

  // Auto-scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Find the first processing or pending job
    const activeIndex = jobs.findIndex(j => j.status === 'processing');
    
    // If we found an active job and have the scroll container
    if (activeIndex !== -1 && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Calculate position of active item (approximate height of item is 60px)
        const itemHeight = 60; 
        const targetScrollTop = activeIndex * itemHeight;
        
        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [jobs, completed]); // Trigger when jobs change or a job completes

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Status Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1A1A1C]/90 to-[#0A0A0B]/90 backdrop-blur-xl shadow-xl group">
        
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
        
        {/* Shine Effect */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />

          <div className="relative p-4 space-y-5">
          
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3 items-center justify-center">
                   <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <h3 className="text-sm font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary background-animate">
                  Optimizing Your Data...
                </h3>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground/80 pl-5">
                Processing active • Please keep browser open
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="h-7 px-3 text-[10px] font-medium shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all duration-300 hover:scale-105"
            >
              <Square className="h-3 w-3 mr-1.5 fill-current" />
              Stop
            </Button>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 w-full bg-secondary/30 rounded-full overflow-hidden p-[1px] ring-1 ring-white/10 shadow-inner">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-primary background-animate transition-all duration-700 ease-out relative overflow-hidden shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer on bar */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="group/stat relative overflow-hidden rounded-lg bg-black/20 border border-white/5 p-2.5 transition-all hover:bg-white/5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex flex-col items-center gap-0.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-0.5 group-hover/stat:scale-110 transition-transform duration-300" />
                <span className="text-lg font-black text-foreground tracking-tight">{completed}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Success</span>
              </div>
            </div>
            
            <div className="group/stat relative overflow-hidden rounded-lg bg-background/50 border border-border/50 p-2.5 transition-all hover:bg-background/80 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/10">
              <div className="flex flex-col items-center gap-0.5">
                <XCircle className="h-4 w-4 text-destructive mb-0.5 group-hover/stat:scale-110 transition-transform duration-300" />
                <span className="text-lg font-black text-foreground tracking-tight">{failed}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Failed</span>
              </div>
            </div>

            <div className="group/stat relative overflow-hidden rounded-lg bg-background/50 border border-border/50 p-2.5 transition-all hover:bg-background/80 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex flex-col items-center gap-0.5">
                <Clock className="h-4 w-4 text-blue-500 mb-0.5 group-hover/stat:scale-110 transition-transform duration-300" />
                <span className="text-lg font-black text-foreground tracking-tight">{remaining}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
            Live Activity
          </h4>
          <span className="text-[10px] bg-secondary/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-muted-foreground font-medium border border-border/50">
            {remaining} pending
          </span>
        </div>
        
        <div className="rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden shadow-sm">
          <ScrollArea ref={scrollRef} className="h-[280px]">
            <div className="p-3 space-y-2">
              {jobs.map((job, index) => (
                <div 
                  key={job.id} 
                  className="animate-in slide-in-from-bottom-2 fade-in duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JobRow job={job} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
