
import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { MarketplaceSelector } from '../components/MarketplaceSelector';

interface RufusQAProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export const RufusQA: React.FC<RufusQAProps> = ({
  onDataChange,
  initialData,
}) => {
  const [marketplace, setMarketplace] = useState<string>(initialData?.marketplace || 'us');
  const [inputs, setInputs] = useState<string>(initialData?.asinList ? (Array.isArray(initialData.asinList) ? initialData.asinList.join('\n') : initialData.asinList) : '');

  // Sync with Parent
  useEffect(() => {
    // Split by newline and filter valid inputs
    const asinList = inputs.split('\n').map(s => s.trim()).filter(line => line.length > 0);
    
    onDataChange({
      marketplace,
      asinList,
      // Generic inputs for scheduler if needed
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
          <MessageSquare className="w-4 h-4 text-primary" />
          Enter ASINs
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
      
      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        <p>This tool will find the top "Related Questions" for each ASIN and retrieve their AI-generated answers using Rufus.</p>
      </div>
    </div>
  );
};
