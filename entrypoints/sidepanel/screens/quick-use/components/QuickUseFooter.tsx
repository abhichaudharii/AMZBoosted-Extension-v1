import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickUseFooterProps {
  handleStart: () => void;
  isProcessing: boolean;
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
}

export const QuickUseFooter: React.FC<QuickUseFooterProps> = ({
  handleStart,
  isProcessing,
  showLogs,
  setShowLogs
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0A0A0B]/80 backdrop-blur-xl border-t border-white/5 z-10">
      <div className="flex gap-3">
        <Button 
          onClick={handleStart} 
          className="flex-1 h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Start Processing'}
        </Button>
        <div className="relative">
          <Button
            variant={showLogs ? "secondary" : "outline"}
            onClick={() => setShowLogs(!showLogs)}
            className="h-11 w-11 p-0 shrink-0 hidden"
            title={showLogs ? "Hide Logs" : "Show Logs"}
          >
            <FileText className="h-5 w-5" />
          </Button>
          {showLogs && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
