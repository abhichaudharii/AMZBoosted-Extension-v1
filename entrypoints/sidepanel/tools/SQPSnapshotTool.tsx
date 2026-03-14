import React, { useState, useEffect } from 'react';
import { PlanGatedAccountSelector } from '../components/inputs/PlanGatedAccountSelector';
import { WeekSelector } from '../components/inputs/WeekSelector';
import { GlobalAccount, Marketplace } from '@/lib/services/account.service';
import { DownloadType } from '../components/inputs/DownloadTypeSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { sqpUniversalService } from '@/lib/services/tools/sqp-universal.service';

interface SQPSnapshotToolProps {
  toolId: string;
  onDataChange: (data: any) => void;
  initialData?: any;
  downloadType?: DownloadType;
  outputFormat?: string;
  availableMarketplaces?: any[];
}

export const SQPSnapshotTool: React.FC<SQPSnapshotToolProps> = ({
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
  const [weeks, setWeeks] = useState<string[]>(initialData?.weeks || []);
  const [activeTab, setActiveTab] = useState(initialData?.activeTab || 'url');

  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  
  // Week fetching state - initialize from persisted data if available
  const [fetchedWeeks, setFetchedWeeks] = useState<{ label: string; value: string }[]>(initialData?.fetchedWeeks || []);
  const [isFetchingWeeks, setIsFetchingWeeks] = useState(false);

  const STORAGE_KEY = `sqp_tool_${toolId}_data`;

  // Load persisted state if no initialData provided (fallback)
  useEffect(() => {
    if (!initialData) {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.marketplace) setMarketplace(parsed.marketplace);
          if (parsed.asins) setAsins(parsed.asins);
          if (parsed.weeks) setWeeks(parsed.weeks);
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (parsed.fetchedWeeks) setFetchedWeeks(parsed.fetchedWeeks);
        }
      } catch (error) {
        console.error('Failed to load saved tool data:', error);
      }
    }
  }, [toolId, initialData]);

  // Persist state on change
  useEffect(() => {
    const dataToSave = {
      marketplace,
      asins,
      weeks,
      activeTab,
      fetchedWeeks
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [marketplace, asins, weeks, activeTab, fetchedWeeks, toolId]);

  // Emit data changes
  useEffect(() => {
    const asinList = asins.split('\n').filter((a: string) => a.trim());
    onDataChange({
      // Pro/Business path
      globalAccountId: selectedGlobalAccountId,
      marketplaceIds: selectedMarketplace ? [selectedMarketplace.marketplaceId] : undefined,
      // Starter fallback
      marketplace,
      asins: asinList,
      weeks,
      downloadType,
      outputFormat,
      fetchedWeeks
    });
  }, [selectedGlobalAccountId, selectedMarketplace, marketplace, asins, weeks, downloadType, outputFormat, fetchedWeeks, onDataChange]);

  const handleClearAsins = () => {
    setAsins('');
  };

  // Clear fetched weeks when marketplace changes to force re-fetch or show correct state
  // But user said "stays same for other countries as well" - actually weeks might differ slightly but usually consistent.
  // However, to be safe and follow "if no week saved for that tool show fetch week button", 
  // we should probably keep them if they exist, or maybe clear them if marketplace changes?
  // User said: "if weeks are there in saved load those giev refresh weeks button... not need to reload the weeks again and again"
  // So we will NOT clear them automatically on marketplace change. We'll let the user decide to refresh.

  const handleFetchWeeks = async () => {
    setIsFetchingWeeks(true);
    const loadingToast = toast.loading('Fetching available weeks...'); 
    try {
        const weeks = await sqpUniversalService.fetchWeeks(marketplace);
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

  const parseCsvUrls = (csvContent: string): string[] => {
    const lines = csvContent.split('\n');
    const urls: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        // Simple extraction: assume ASINs or URLs are in the first column or just raw text
        // If it looks like a URL or ASIN (alphanumeric 10 chars), take it
        const columns = trimmed.split(',').map(col => col.trim().replace(/"/g, ''));
        columns.forEach(col => {
            if (col) urls.push(col);
        });
      }
    });

    return urls;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoadingCsv(true);
      
      const loadingToast = toast.loading('Processing CSV file...', {
        description: `Reading ${file.name}`,
      });

      try {
        const text = await file.text();
        const extractedAsins = parseCsvUrls(text);

        if (extractedAsins.length > 0) {
          const currentAsins = asins ? asins.split('\n').filter((u: string) => u.trim()) : [];
          const allAsins = [...currentAsins, ...extractedAsins];
          setAsins(allAsins.join('\n'));

          toast.success('CSV Loaded Successfully!', {
            id: loadingToast,
            description: `${extractedAsins.length} ASINs loaded`,
            icon: <CheckCircle2 className="h-5 w-5" />,
            duration: 4000,
          });
        } else {
          toast.warning('No Data Found', {
            id: loadingToast,
            description: 'The CSV file does not contain valid data',
            duration: 4000,
          });
        }
        e.target.value = '';
      } catch (error) {
        toast.error('Failed to Load CSV', {
          id: loadingToast,
          description: `Error: ${error}`,
          duration: 5000,
        });
      } finally {
        setIsLoadingCsv(false);
      }
    }
  };

  const asinCount = asins.split('\n').filter((a: string) => a.trim()).length;

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

      {/* ASIN Input Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2 h-8">
            <TabsTrigger value="url" className="text-xs h-6">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv" className="text-xs h-6">File Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="mt-0">
            <div className="relative group rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <Textarea
                    placeholder="Enter ASINs (one per line)"
                    value={asins}
                    onChange={(e) => setAsins(e.target.value)}
                    className="min-h-[120px] font-mono text-xs resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-3 placeholder:text-muted-foreground/50"
                    disabled={isLoadingCsv}
                />
                {asinCount > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {asinCount} {asinCount !== 1 ? 'Items' : 'Item'}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearAsins}
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            title="Clear All"
                        >
                            <span className="sr-only">Clear</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </Button>
                    </div>
                )}
            </div>
        </TabsContent>
        
        <TabsContent value="csv" className="mt-0">
            <div className="rounded-lg border border-dashed border-input hover:border-primary/50 transition-colors bg-muted/5 p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                <Label className="text-sm font-medium cursor-pointer text-foreground hover:text-primary transition-colors">
                    {isLoadingCsv ? 'Processing...' : 'Click to Upload'}
                    <Input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoadingCsv}
                    />
                </Label>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Supports .csv and .txt files
                </p>
            </div>
        </TabsContent>
      </Tabs>

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
