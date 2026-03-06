import React, { useState, useEffect } from 'react';
import { accountService, GlobalAccount, Marketplace } from '@/lib/services/account.service';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AccountMarketplaceSelectorProps {
  selectedGlobalAccountId?: string;
  onGlobalAccountChange: (account: GlobalAccount) => void;
  selectedMarketplace?: Marketplace | null;
  onMarketplaceChange: (marketplace: Marketplace) => void;
}

export const AccountMarketplaceSelector: React.FC<AccountMarketplaceSelectorProps> = ({
  selectedGlobalAccountId,
  onGlobalAccountChange,
  selectedMarketplace,
  onMarketplaceChange,
}) => {
  const [globalAccounts, setGlobalAccounts] = useState<GlobalAccount[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  
  const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
  const [isFetchingMarketplaces, setIsFetchingMarketplaces] = useState(false);

  // Storage Keys
  const STORAGE_KEY_ACCOUNTS = 'amz_boosted_global_accounts';
  const STORAGE_KEY_MARKETPLACES_PREFIX = 'amz_boosted_marketplaces_';

  // Initial Load - Global Accounts
  useEffect(() => {
    const loadAccounts = async () => {
      // Try cache first
      const cached = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setGlobalAccounts(parsed);
          
          // If no account selected but we have accounts, select the first one marked 'selected' or just the first one
          if (!selectedGlobalAccountId && parsed.length > 0) {
            const defaultAcc = parsed.find((a: GlobalAccount) => a.selected) || parsed[0];
            onGlobalAccountChange(defaultAcc);
          }
          return;
        } catch (e) {
            console.error('Error parsing cached accounts', e);
        }
      }

      // If no cache, fetch
      await handleRefreshAccounts();
    };

    loadAccounts();
  }, []);

  // Load Marketplaces when Global Account changes
  useEffect(() => {
    if (!selectedGlobalAccountId) return;

    const loadMarketplaces = async () => {
      // Try cache
      const cacheKey = STORAGE_KEY_MARKETPLACES_PREFIX + selectedGlobalAccountId;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMarketplaces(parsed);
          
          // Auto-select if there's a match or default
          // Wait, we shouldn't auto-change marketplace if one is already selected unless it's invalid for this account
          // But usually switching global account means we should pick a default marketplace for that account.
          
          const defaultMk = parsed.find((m: Marketplace) => m.selected) || parsed[0];
          if (defaultMk) {
               onMarketplaceChange(defaultMk);
          }
          return;
        } catch (e) {
            console.error('Error parsing cached marketplaces', e);
        }
      }

      // If no cache, fetch
      await handleRefreshMarketplaces(selectedGlobalAccountId);
    };

    loadMarketplaces();
  }, [selectedGlobalAccountId]);


  const handleRefreshAccounts = async () => {
    setIsFetchingAccounts(true);
    try {
      const accounts = await accountService.fetchGlobalAccounts();
      setGlobalAccounts(accounts);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      
      if (accounts.length > 0) {
           // If we refreshed, update selection if needed
           if (!selectedGlobalAccountId) {
                const defaultAcc = accounts.find(a => a.selected) || accounts[0];
                onGlobalAccountChange(defaultAcc);
           }
      } else {
          toast.warning("No global accounts found. Are you logged in?");
      }
    } catch (error) {
      console.error('Failed to fetch global accounts', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setIsFetchingAccounts(false);
    }
  };

  const handleRefreshMarketplaces = async (globalAccId?: string) => {
    const targetId = globalAccId || selectedGlobalAccountId;
    if (!targetId) return;

    setIsFetchingMarketplaces(true);
    try {
      const markets = await accountService.fetchMarketplaces(targetId);
      setMarketplaces(markets);
      localStorage.setItem(STORAGE_KEY_MARKETPLACES_PREFIX + targetId, JSON.stringify(markets));

      if (markets.length > 0) {
        // Auto select the 'selected' one from Amazon, or the first one
        const defaultMk = markets.find(m => m.selected) || markets[0];
        onMarketplaceChange(defaultMk);
      } else {
        toast.warning("No marketplaces found for this account.");
      }

    } catch (error) {
      console.error('Failed to fetch marketplaces', error);
      toast.error('Failed to fetch marketplaces');
    } finally {
      setIsFetchingMarketplaces(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
      {/* Global Account Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Amazon Account</Label>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => handleRefreshAccounts()}
                disabled={isFetchingAccounts}
                title="Refresh Global Accounts"
            >
                <RefreshCw className={`h-3 w-3 ${isFetchingAccounts ? 'animate-spin' : ''}`} />
            </Button>
        </div>
        
        <Select 
            value={selectedGlobalAccountId} 
            onValueChange={(val) => {
                const acc = globalAccounts.find(a => a.id === val);
                if (acc) onGlobalAccountChange(acc);
            }}
            disabled={isFetchingAccounts}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            {globalAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Marketplace Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Target Marketplace</Label>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => handleRefreshMarketplaces()}
                disabled={isFetchingMarketplaces || !selectedGlobalAccountId}
                title="Refresh Marketplaces"
            >
                <RefreshCw className={`h-3 w-3 ${isFetchingMarketplaces ? 'animate-spin' : ''}`} />
            </Button>
        </div>

        <Select 
            value={selectedMarketplace?.id} 
            onValueChange={(val) => {
                const mk = marketplaces.find(m => m.id === val); // id matches mons_sel_mkid/mcid
                if (mk) onMarketplaceChange(mk);
            }}
            disabled={isFetchingMarketplaces || !selectedGlobalAccountId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Marketplace" />
          </SelectTrigger>
          <SelectContent>
            {marketplaces.map((mk) => (
              <SelectItem key={mk.id} value={mk.id}>
                <span className="flex items-center gap-2">
                    <img 
                        src={`https://flagcdn.com/w20/${mk.countryCode.toLowerCase()}.png`} 
                        srcSet={`https://flagcdn.com/w40/${mk.countryCode.toLowerCase()}.png 2x`}
                        width="20" 
                        alt={mk.countryCode} 
                        className="rounded-sm object-cover"
                    />
                    {mk.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
