import React from 'react';
import { X, Info, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: any; // Or use your Tool type definition
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, tool }) => {
  if (!isOpen || !tool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Color Theme */}
        <div className={cn("px-6 py-6 bg-gradient-to-br opacity-100", 
          // Dynamic background based on tool theme if available, else default
          tool.theme === 'violet' ? 'from-violet-500/20 to-purple-500/10' :
          tool.theme === 'blue' ? 'from-blue-500/20 to-cyan-500/10' :
          'from-slate-500/20 to-gray-500/10'
        )}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-background/50 rounded-xl backdrop-blur-md shadow-sm">
                 {tool.icon ? <tool.icon className="w-6 h-6 text-foreground" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{tool.name}</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Tool Information
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          
          {/* Main Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="w-4 h-4 text-primary" />
              <h3>What it does</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>

          {/* Detailed Help Text */}
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              <h3>How to use</h3>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.helpText || "No detailed instructions available for this tool yet."}
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2">
            <Button className="w-full" onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};