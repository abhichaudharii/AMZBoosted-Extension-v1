import React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlagUS, FlagUK, FlagCA, FlagIN, FlagDE, FlagFR, FlagIT, FlagES } from '@/lib/flags';

const flagMap: Record<string, React.FC<{ className?: string }>> = {
  US: FlagUS,
  UK: FlagUK,
  CA: FlagCA,
  IN: FlagIN,
  DE: FlagDE,
  FR: FlagFR,
  IT: FlagIT,
  ES: FlagES,
};

interface MarketplaceIconProps {
  marketplace: string;
  className?: string;
  showName?: boolean;
}

export const MarketplaceIcon: React.FC<MarketplaceIconProps> = ({ 
  marketplace, 
  className,
  showName = false
}) => {
  const Flag = flagMap[marketplace] || flagMap[marketplace?.toUpperCase()];

  return (
    <div className="flex items-center gap-2">
      {Flag ? (
        <Flag className={cn("w-5 h-4 rounded-[1px]", className)} />
      ) : (
        <Globe className={cn("w-4 h-4", className)} />
      )}
      {showName && <span className="text-sm font-medium">{marketplace}</span>}
    </div>
  );
};
