import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from '@/components/ui/input';
import { PlanGatedAccountSelector } from '../components/inputs/PlanGatedAccountSelector';
import { GlobalAccount, Marketplace } from '@/lib/services/account.service';
import { CalendarIcon, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalesTrafficDrilldownProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export const SalesTrafficDrilldown: React.FC<SalesTrafficDrilldownProps> = ({ onDataChange, initialData }) => {
  // Always singleDateRange
  const downloadType = 'singleDateRange';
  const [startDate, setStartDate] = useState<string>(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(initialData?.endDate || new Date().toISOString().split('T')[0]);
  const [asins, setAsins] = useState<string>(initialData?.asinList ? initialData.asinList.join('\n') : ''); 
  
  // Account/Marketplace State (Pro/Business: full account object; Starter: country code string)
  const [selectedAccount, setSelectedAccount] = useState<GlobalAccount | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [simpleMarketplace, setSimpleMarketplace] = useState<string>(initialData?.marketplace || 'US');

  // Sync data with parent on any change
  useEffect(() => {
    const asinList = asins.split('\n').map(a => a.trim()).filter(a => a.length > 0);

    if (selectedMarketplace && selectedAccount) {
        // Pro/Business: full account + marketplace data for auto-switching
        onDataChange({
            downloadType,
            startDate,
            endDate,
            asinList,
            marketplace: selectedMarketplace.countryCode,
            marketURL: selectedMarketplace.domain,
            globalAccountId: selectedAccount.id,
            marketplaceIds: selectedMarketplace.ids,
        });
    } else {
        // Starter: uses active session, only passes marketplace code
        onDataChange({
            downloadType,
            startDate,
            endDate,
            asinList,
            marketplace: simpleMarketplace,
        });
    }
  }, [downloadType, startDate, endDate, asins, selectedAccount, selectedMarketplace, simpleMarketplace, onDataChange]);

  const handleClearAsins = () => {
    setAsins('');
  };

  const asinCount = asins.split('\n').filter(a => a.trim()).length;

  return (
    <div className="space-y-4 animate-fade-in relative">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                {/* Account & Marketplace Selector — Pro/Business: full account picker; Starter: simple dropdown */}
                <PlanGatedAccountSelector
                    selectedGlobalAccountId={selectedAccount?.id}
                    onGlobalAccountChange={setSelectedAccount}
                    selectedMarketplace={selectedMarketplace}
                    onMarketplaceChange={setSelectedMarketplace}
                    marketplaceValue={simpleMarketplace}
                    onMarketplaceValueChange={setSimpleMarketplace}
                />
            </div>
        </div>


       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
           <Label className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-primary" /> Start Date</Label>
           <div className="relative">
             <Input 
               type="date" 
               value={startDate} 
               onChange={(e) => setStartDate(e.target.value)}
               className="pl-3 [color-scheme:light] dark:[color-scheme:dark]" 
             />
           </div>
        </div>
         <div className="space-y-2">
           <Label className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-primary" /> End Date</Label>
           <div className="relative">
             <Input 
               type="date" 
               value={endDate} 
               onChange={(e) => setEndDate(e.target.value)}
               className="pl-3 [color-scheme:light] dark:[color-scheme:dark]"
             />
           </div>
        </div>
       </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><List className="h-3.5 w-3.5 text-primary" /> ASINs (Optional)</Label>
        <div className="relative group rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
            <Textarea 
              placeholder="Enter Parent/Child ASINs (one per line). Leave empty to fetch all children."
              value={asins}
              onChange={(e) => setAsins(e.target.value)}
              className="min-h-[120px] font-mono text-xs resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-3 placeholder:text-muted-foreground/50"
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
        <p className="text-[10px] text-muted-foreground">If specific ASINs are not provided, the report usually returns all data available in the date range.</p>
      </div>
    </div>
  );
};
