import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full border-transparent border-t-primary border-r-primary animate-spin',
            sizeClasses[size]
          )}
          style={{
            background: 'linear-gradient(transparent, transparent)',
          }}
        />
        <div
          className={cn(
            'absolute top-0 left-0 rounded-full border-transparent opacity-30 animate-pulse',
            sizeClasses[size]
          )}
          style={{
            borderTopColor: '#FF6B00',
            borderRightColor: '#FF914D',
          }}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
    </div>
  );
};

interface LoadingBarProps {
  className?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ className }) => {
  return (
    <div className={cn('w-full h-1 bg-secondary/30 rounded-full overflow-hidden', className)}>
      <div className="h-full brand-gradient animate-shimmer bg-[length:200%_100%]" />
    </div>
  );
};
