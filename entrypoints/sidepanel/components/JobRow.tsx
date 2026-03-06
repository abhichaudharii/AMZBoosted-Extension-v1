import React from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { JobStatus } from '../lib/types';
import { cn } from '@/lib/utils';

interface JobRowProps {
  job: JobStatus;
}

export const JobRow: React.FC<JobRowProps> = ({ job }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusLabel = () => {
    switch (job.status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
    }
  };

  return (
    <div className="group border border-border/50 rounded-md p-2 transition-all duration-300 hover:bg-muted/30 hover:border-primary/20 hover:shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="transition-transform duration-300 group-hover:scale-110">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground truncate group-hover:text-foreground transition-colors">
            {job.url}
          </p>
        </div>
        <span className={cn(
          "text-[9px] font-medium shrink-0 px-1.5 py-0.5 rounded-full bg-secondary/50 transition-colors",
          job.status === 'completed' && "bg-green-500/10 text-green-600",
          job.status === 'error' && "bg-red-500/10 text-red-600",
          job.status === 'processing' && "bg-primary/10 text-primary"
        )}>
          {getStatusLabel()}
        </span>
      </div>

        <div className="mt-1">
          <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-primary transition-all duration-500 ease-out relative overflow-hidden",
                job.status === 'error' && "bg-destructive"
              )}
              style={{ width: `${job.progress}%` }}
            >
               {job.status === 'processing' && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
               )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[9px] text-muted-foreground font-medium">
              {Math.round(job.progress)}%
            </p>
            {job.statusMessage && (
              <p className="text-[9px] text-muted-foreground/80 font-medium animate-pulse truncate max-w-[150px] text-right">
                {job.statusMessage}
              </p>
            )}
          </div>
        </div>

      {job.error && (
        <div className="mt-1.5 text-[9px] text-destructive bg-destructive/5 p-1.5 rounded border border-destructive/10 flex items-start gap-1">
            <XCircle className="h-2.5 w-2.5 shrink-0 mt-0.5" />
            <p>{job.error}</p>
        </div>
      )}
    </div>
  );
};
