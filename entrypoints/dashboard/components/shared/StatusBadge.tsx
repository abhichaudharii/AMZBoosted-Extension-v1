import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'active' | 'paused' | 'completed' | 'failed' | 'processing' | 'pending';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: 'default',
  completed: 'default', // Using default (usually green/primary) for success
  paused: 'secondary',
  pending: 'secondary',
  processing: 'outline',
  failed: 'destructive',
};

// Optional: Custom color overrides if variants aren't enough
const colorMap: Record<string, string> = {
  active: 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/25',
  completed: 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/25',
  failed: 'bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/25',
  paused: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25',
  processing: 'bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/25 animate-pulse',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalizedStatus = status.toLowerCase();
  
  // Use custom color if available, otherwise fallback to standard variants
  const customClass = colorMap[normalizedStatus];
  
  return (
    <Badge 
      variant={variantMap[normalizedStatus] || 'secondary'}
      className={cn("capitalize", customClass, className)}
    >
      {status}
    </Badge>
  );
};
