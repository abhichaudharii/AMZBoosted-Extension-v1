
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tag } from 'lucide-react';
import { MarketplaceSelector } from '../components/MarketplaceSelector';

interface PriceTrackerToolProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export const PriceTrackerTool: React.FC<PriceTrackerToolProps> = ({
  onDataChange,
  initialData,
}) => {
  const [marketplace, setMarketplace] = React.useState<string>(initialData?.marketplace || 'us');
  const [inputs, setInputs] = React.useState<string>(initialData?.asinList ? (Array.isArray(initialData.asinList) ? initialData.asinList.join('\n') : initialData.asinList) : '');

  // Update parent when local state changes
  useEffect(() => {
    // Split by newline and filter valid inputs
    const asinList = inputs.split('\n').filter(line => line.trim().length > 0);
    
    onDataChange({
      marketplace,
      asinList,
      asins: asinList
    });
  }, [marketplace, inputs, onDataChange]);

  return (
    <div className="space-y-6">
      {/* Marketplace Selector */}
      <MarketplaceSelector
        value={marketplace}
        onChange={setMarketplace}
      />

      {/* ASIN Input */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Tag className="w-4 h-4 text-primary" />
          Enter ASINs to Track
        </Label>
        
        <Textarea
          placeholder={`B012345678\nB087654321\n...`}
          className="min-h-[150px] font-mono text-sm resize-none focus-visible:ring-primary"
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
        />
        
        <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
          <span>One ASIN per line</span>
          <span>{inputs.split('\n').filter(l => l.trim()).length} ASINs</span>
        </div>
      </div>
    </div>
  );
};
