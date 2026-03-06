import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MarketplaceSelector } from '../../components/MarketplaceSelector';

interface GenericToolInputsProps {
  marketplace: string;
  setMarketplace: (value: string) => void;
  urls: string;
  setUrls: (value: string) => void;
  isProcessing: boolean;
  handleClearUrls: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingCsv: boolean;
  inputLabel?: string;
  placeholder?: string;
  helperText?: string;
}

export const GenericToolInputs: React.FC<GenericToolInputsProps> = ({
  marketplace,
  setMarketplace,
  urls,
  setUrls,
  isProcessing,
  handleClearUrls,
  handleFileChange,
  isLoadingCsv,
  inputLabel = "Enter URLs",
  placeholder = "https://amazon.com/dp/B0...\nhttps://amazon.com/dp/B0...",
  helperText = "One URL per line"
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Target Marketplace</Label>
        <MarketplaceSelector
            value={marketplace}
            onChange={setMarketplace}
        />
      </div>
      
      <div className="space-y-2">
        <Label>{inputLabel}</Label>
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            className="min-h-[150px] font-mono text-xs resize-none pr-10 bg-[#1A1A1C]/60 border-white/5 focus:border-primary/20 placeholder:text-white/20 text-white"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            spellCheck={false}
            disabled={isProcessing}
          />
          <div className="absolute right-2 top-2 flex flex-col gap-2">
             {urls && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={handleClearUrls}
                    title="Clear All"
                >
                    <span className="sr-only">Clear</span>
                    ×
                </Button>
             )}
          </div>
          <div className="absolute right-2 bottom-2 text-xs text-white/40 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded border border-white/5">
            {urls.split('\n').filter(u => u.trim()).length}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
           <span>{helperText}</span>
           <div className="flex gap-2">
              <input
                type="file"
                accept=".csv, .txt"
                className="hidden"
                id="csv-upload"
                onChange={handleFileChange}
                disabled={isLoadingCsv}
              />
              <Label
                htmlFor="csv-upload"
                className={`cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors ${isLoadingCsv ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                 {isLoadingCsv ? (
                    <span className="animate-spin">⏳</span>
                 ) : (
                    <Upload className="h-3 w-3" />
                 )}
                 Upload CSV
              </Label>
           </div>
        </div>
      </div>
    </div>
  );
};
