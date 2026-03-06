import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { marketplaces } from '@/lib/marketplaces';
import { flags } from '@/lib/flags';
import { cn } from '@/lib/utils';

interface MarketplaceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  availableMarketplaces?: any[];
}

export const MarketplaceSelector: React.FC<MarketplaceSelectorProps> = ({
  value,
  onChange,
  className,
  availableMarketplaces,
}) => {
  // Use availableMarketplaces if provided, otherwise use all


  // Ideally, availableMarketplaces passed from QuickUse are already the correct objects.
  // let's assume they are. But wait, mapped = ... find(m => m.name === fm.label).
  // So they ARE the Marketplace objects from 'lib/tools'.
  // So we can just use availableMarketplaces || marketplaces.

  const finalMarketplaces = availableMarketplaces || marketplaces;

  const selectedMarketplace = finalMarketplaces.find((m) => m.id === value);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label with Icon */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
            <Globe className="h-3.5 w-3.5 text-primary" />
        </div>
        <label className="text-sm font-medium">
            Target Marketplace
        </label>
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className="w-full bg-[#1A1A1C]/60 border-white/5 backdrop-blur-sm focus:ring-primary/20 hover:bg-white/5 transition-all text-white"
        >
          <SelectValue placeholder="Select a market...">
            {selectedMarketplace ? (
              <div className="flex items-center gap-2.5">
                {/* Safe Flag Rendering */}
                <div className="flex-shrink-0 w-5 h-4 rounded-[2px] overflow-hidden shadow-sm relative">
                    {flags[selectedMarketplace.flagKey as keyof typeof flags] ? (
                        React.createElement(flags[selectedMarketplace.flagKey as keyof typeof flags], { className: 'w-full h-full object-cover' })
                    ) : (
                        <Globe className="w-full h-full text-muted-foreground p-0.5" />
                    )}
                </div>
                <span className="text-sm font-medium">{selectedMarketplace.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select Marketplace</span>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent 
            className="bg-[#0A0A0B]/95 backdrop-blur-xl border-white/10 shadow-2xl max-h-[300px] text-white"
            position="popper"
            sideOffset={5}
        >
          {finalMarketplaces.map((marketplace) => {
            const FlagComponent = flags[marketplace.flagKey as keyof typeof flags];
            
            return (
              <SelectItem 
                key={marketplace.id} 
                value={marketplace.id}
                className="cursor-pointer focus:bg-primary/10 focus:text-primary pl-3 pr-2 py-2.5 my-0.5 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-5 h-4 rounded-[2px] overflow-hidden shadow-sm border border-border/20">
                    {FlagComponent ? (
                        <FlagComponent className="w-full h-full object-cover" />
                    ) : (
                        <Globe className="w-full h-full p-0.5" />
                    )}
                  </div>
                  
                  <span className="text-sm">{marketplace.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};