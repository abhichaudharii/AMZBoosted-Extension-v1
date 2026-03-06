import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 animate-float">
          <Icon className="h-12 w-12 integration-icon" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 gradient-text">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="btn-primary-premium hover-scale"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
