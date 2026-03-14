import React, { useState, useEffect } from 'react';
import { PlanGatedAccountSelector } from '../components/inputs/PlanGatedAccountSelector';
import { WeekSelector } from '../components/inputs/WeekSelector';
import { GlobalAccount, Marketplace } from '@/lib/services/account.service';
import { DownloadType } from '../components/inputs/DownloadTypeSelector';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Package, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { topTermsService } from '@/lib/services/tools/top-terms.service';

interface TopTermsToolProps {
  toolId: string;
  onDataChange: (data: any) => void;
  initialData?: any;
  downloadType?: DownloadType;
  outputFormat?: string;
  availableMarketplaces?: any[];
}

export const TopTermsTool: React.FC<TopTermsToolProps> = ({
  toolId,
  onDataChange,
  initialData,
  downloadType = 'all-in-one',
  outputFormat = 'csv',
  availableMarketplaces,
}) => {
  // State
  // Pro/Business account selection path
  const [selectedGlobalAccountId, setSelectedGlobalAccountId] = useState<string | undefined>(initialData?.globalAccountId);
  const [selectedGlobalAccount, setSelectedGlobalAccount] = useState<GlobalAccount | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  // Starter fallback path
  const [marketplace, setMarketplace] = useState(initialData?.marketplace || 'us');
  const [asins, setAsins] = useState(initialData?.asins?.join('\n') || '');
  const [searchTerms, setSearchTerms] = useState(initialData?.searchTerms?.join('\n') || '');
  const [weeks, setWeeks] = useState<string[]>(initialData?.weeks || []);


  
  // Week fetching state
  const [fetchedWeeks, setFetchedWeeks] = useState<{ label: string; value: string }[]>(initialData?.fetchedWeeks || []);
  const [isFetchingWeeks, setIsFetchingWeeks] = useState(false);

  const STORAGE_KEY = `top_terms_tool_${toolId}_data`;

  // Load persisted state
  useEffect(() => {
    if (!initialData) {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.marketplace) setMarketplace(parsed.marketplace);
          if (parsed.asins) setAsins(parsed.asins);
          if (parsed.searchTerms) setSearchTerms(parsed.searchTerms);
          if (parsed.weeks) setWeeks(parsed.weeks);
          if (parsed.fetchedWeeks) setFetchedWeeks(parsed.fetchedWeeks);
        }
      } catch (error) {
        console.error('Failed to load saved tool data:', error);
      }
    }
  }, [toolId, initialData]);

  // Persist state
  useEffect(() => {
    const dataToSave = {
      marketplace,
      asins,
      searchTerms,
      weeks,
      fetchedWeeks
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [marketplace, asins, searchTerms, weeks, fetchedWeeks, toolId]);

  // Emit data changes
  useEffect(() => {
    const asinList = asins.split('\n').filter((a: string) => a.trim());
    const termList = searchTerms.split('\n').filter((t: string) => t.trim());
    
    onDataChange({
      // Pro/Business path
      globalAccountId: selectedGlobalAccountId,
      marketplaceIds: selectedMarketplace ? [selectedMarketplace.marketplaceId] : undefined,
      // Starter fallback
      marketplace,
      asins: asinList,
      searchTerms: termList,
      weeks,
      downloadType,
      outputFormat,
      fetchedWeeks
    });
  }, [selectedGlobalAccountId, selectedMarketplace, marketplace, asins, searchTerms, weeks, downloadType, outputFormat, fetchedWeeks, onDataChange]);

  const handleFetchWeeks = async () => {
    setIsFetchingWeeks(true);
    const loadingToast = toast.loading('Fetching available weeks...'); 
    try {
        const weeks = await topTermsService.getWeeks(marketplace);
        setFetchedWeeks(weeks);
        
        if (weeks.length > 0) {
            toast.success(`Found ${weeks.length} weeks`, { id: loadingToast });
        } else {
            toast.warning('No weeks found. Make sure you are logged in to Seller Central.', { id: loadingToast });
        }
    } catch (error) {
        console.error('Failed to fetch weeks:', error);
        toast.error('Failed to fetch weeks', { 
            id: loadingToast,
            description: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        setIsFetchingWeeks(false);
    }
  };



  const asinCount = asins.split('\n').filter((a: string) => a.trim()).length;
  const termCount = searchTerms.split('\n').filter((t: string) => t.trim()).length;

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Account + Marketplace Selector (plan-gated) */}
      <PlanGatedAccountSelector
        selectedGlobalAccountId={selectedGlobalAccountId}
        onGlobalAccountChange={(account) => {
          setSelectedGlobalAccount(account);
          setSelectedGlobalAccountId(account?.merchantId);
        }}
        selectedMarketplace={selectedMarketplace}
        onMarketplaceChange={setSelectedMarketplace}
        marketplaceValue={marketplace}
        onMarketplaceValueChange={setMarketplace}
      />

      {/* Input Area */}
      {/* Input Area */}
      <div className="space-y-6">
            {/* ASINs Input */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                        <Package className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Label className="text-sm font-medium">ASINs (Optional)</Label>
                </div>
                <div className="relative group rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                    <Textarea
                        placeholder="Enter ASINs (one per line)"
                        value={asins}
                        onChange={(e) => setAsins(e.target.value)}
                        className="min-h-[80px] font-mono text-xs resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-3 placeholder:text-muted-foreground/50"

                    />
                    {asinCount > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {asinCount} {asinCount !== 1 ? 'Items' : 'Item'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setAsins('')}
                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                title="Clear All"
                            >
                                <span className="sr-only">Clear</span>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Terms Input */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                        <Search className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Label className="text-sm font-medium">Search Terms (Optional)</Label>
                </div>
                <div className="relative group rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                    <Textarea
                        placeholder="Enter Search Terms (one per line)"
                        value={searchTerms}
                        onChange={(e) => setSearchTerms(e.target.value)}
                        className="min-h-[80px] font-mono text-xs resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-3 placeholder:text-muted-foreground/50"

                    />
                    {termCount > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {termCount} {termCount !== 1 ? 'Items' : 'Item'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchTerms('')}
                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                title="Clear All"
                            >
                                <span className="sr-only">Clear</span>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
      </div>

      {/* Week Selector */}
      <div className="space-y-1.5">
        <WeekSelector
            selectedWeeks={weeks}
            onChange={setWeeks}
            options={fetchedWeeks}
            onRefresh={handleFetchWeeks}
            isRefreshing={isFetchingWeeks}
        />
      </div>

    </div>
  );
};
