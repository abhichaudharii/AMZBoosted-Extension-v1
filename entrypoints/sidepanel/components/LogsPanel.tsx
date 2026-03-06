import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal, Trash2, XCircle, CheckCircle2, 
  AlertTriangle, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LogEntry } from '../lib/types';

interface LogsPanelProps {
  logs: LogEntry[];
  onClear?: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear }) => {
  // 1. Ref for auto-scrolling
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logs.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLevelStyles = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return { 
          color: 'text-emerald-600 dark:text-emerald-500', 
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10'
        };
      case 'warning':
        return { 
          color: 'text-amber-600 dark:text-amber-500', 
          icon: AlertTriangle,
          bg: 'bg-amber-500/10'
        };
      case 'error':
        return { 
          color: 'text-red-600 dark:text-red-500', 
          icon: XCircle,
          bg: 'bg-red-500/10'
        };
      case 'info':
      default:
        return { 
          color: 'text-blue-500 dark:text-blue-400', 
          icon: Info,
          bg: 'bg-blue-500/10'
        };
    }
  };

  return (
    <Card className="mt-4 flex flex-col h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300 border-border/50 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
      {/* Header */}
      <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0 flex flex-row items-center justify-between space-y-0 border-b border-border/40">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span>Activity Logs</span>
          <span className="text-xs font-normal text-muted-foreground ml-1 py-0.5 px-2 rounded-full bg-muted/50">
            {logs.length}
          </span>
        </CardTitle>
        
        {onClear && logs.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </Button>
        )}
      </CardHeader>

      {/* Log Content */}
      <CardContent className="px-0 pb-0 flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full">
          <div className="px-4 py-4 space-y-3 font-mono text-xs">
            
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 gap-2 select-none">
                <Terminal className="w-8 h-8 opacity-20" />
                <p>Ready to process...</p>
              </div>
            ) : (
              logs.map((log) => {
                const style = getLevelStyles(log.level);
                const Icon = style.icon;

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "group flex gap-3 animate-in fade-in slide-in-from-left-1 duration-200 pl-2 border-l-2 border-transparent hover:bg-muted/30 -mx-2 px-2 py-1 rounded-r-md transition-colors",
                      style.color.replace('text-', 'border-') // Tint left border on hover/active
                    )}
                  >
                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground/60 min-w-[60px] pt-0.5 select-none font-sans">
                      {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {/* Icon & Message */}
                    <div className="flex gap-2 flex-1 items-start">
                      <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80", style.color)} />
                      <span className={cn("break-all leading-relaxed", 
                         log.level === 'error' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground/90'
                      )}>
                        {log.message}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Invisible anchor for auto-scrolling */}
            <div ref={scrollRef} className="h-px w-full" />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};