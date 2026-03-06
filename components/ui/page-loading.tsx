import React from 'react';
import { cn } from '@/lib/utils';

interface PageLoadingProps {
  text?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
}

// Helper to safely get the extension logo
const getLogoUrl = () => {
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/icon/128.png'; // Fallback for local dev
  }
};

/**
 * Premium animated page loading component
 * Displays when API requests are loading page data
 */
export const PageLoading: React.FC<PageLoadingProps> = ({
  text = 'Loading...',
  subtitle,
  className,
  compact = false,
}) => {
  if (compact) {
    return (
      <div 
        className={cn('flex flex-col items-center justify-center py-12', className)}
        role="status"
        aria-label={text}
      >
        <div className="space-y-4 text-center">
          {/* Loading dots */}
          <div className="flex justify-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce"></div>
          </div>
          {/* Loading text */}
          <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn('flex items-center justify-center min-h-[60vh] py-16', className)}
      role="status"
      aria-label={text}
    >
      <div className="space-y-8 w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Logo Container */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse group-hover:bg-primary/30 transition-all duration-500" />
            
            {/* Logo Image */}
            <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-2xl p-4">
              <img 
                src={getLogoUrl()} 
                alt="Loading Logo" 
                className="h-full w-full object-contain drop-shadow-md animate-pulse" 
              />
            </div>
          </div>
        </div>

        {/* Loading Spinner Dots */}
        <div className="flex justify-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"></div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground tracking-tight animate-pulse">
            {text}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground/80 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[200px] mx-auto pt-2">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 w-[200%] animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loading for cards/content areas
 */
export const PageLoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div 
      className={cn('space-y-6 p-6 animate-pulse', className)}
      aria-hidden="true"
    >
      {/* Header Area */}
      <div className="space-y-3">
        <div className="h-8 w-1/3 rounded-lg bg-muted/60" />
        <div className="h-4 w-1/2 rounded bg-muted/40" />
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="h-48 rounded-xl bg-muted/50 border border-white/5" />
        <div className="h-48 rounded-xl bg-muted/50 border border-white/5" />
        <div className="h-48 rounded-xl bg-muted/50 border border-white/5 md:col-span-2" />
      </div>
    </div>
  );
};

/**
 * Inline loading for buttons/actions
 */
export const InlineLoading: React.FC<{ text?: string; className?: string }> = ({ text, className }) => {
  return (
    <div 
      className={cn('inline-flex items-center gap-2.5', className)}
      role="status"
    >
      <div className="flex gap-1">
        <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"></div>
      </div>
      {text && <span className="text-sm font-medium opacity-90">{text}</span>}
    </div>
  );
};