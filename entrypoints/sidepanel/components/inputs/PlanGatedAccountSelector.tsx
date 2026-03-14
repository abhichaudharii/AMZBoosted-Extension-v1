"use client";

import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { AccountMarketplaceSelector } from './AccountMarketplaceSelector';
import { MarketplaceSelector } from '../MarketplaceSelector';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { GlobalAccount, Marketplace } from '@/lib/services/account.service';

interface PlanGatedAccountSelectorProps {
    // AccountMarketplaceSelector props (used when Pro/Business)
    selectedGlobalAccountId?: string;
    onGlobalAccountChange: (account: GlobalAccount | null) => void;
    selectedMarketplace?: Marketplace | null;
    onMarketplaceChange: (marketplace: Marketplace) => void;

    // Simple marketplace fallback props (used when Starter)
    marketplaceValue?: string;
    onMarketplaceValueChange?: (value: string) => void;
}

/**
 * PlanGatedAccountSelector
 *
 * Pro / Business: shows the full AccountMarketplaceSelector — lets users pick
 * a specific Seller Central account + marketplace. The extension will
 * auto-switch to that account before running the tool.
 *
 * Starter: shows a simple MarketplaceSelector (uses whatever account is
 * currently active in Seller Central) with a Pro upgrade prompt.
 */
export const PlanGatedAccountSelector: React.FC<PlanGatedAccountSelectorProps> = ({
    selectedGlobalAccountId,
    onGlobalAccountChange,
    selectedMarketplace,
    onMarketplaceChange,
    marketplaceValue = 'US',
    onMarketplaceValueChange,
}) => {
    const { checkPermission, loading } = useFeatures();

    // During loading show nothing to avoid flash
    if (loading) return null;

    const canSelectAccount = checkPermission('tool', 'account_selection');

    if (canSelectAccount) {
        return (
            <AccountMarketplaceSelector
                selectedGlobalAccountId={selectedGlobalAccountId}
                onGlobalAccountChange={onGlobalAccountChange}
                selectedMarketplace={selectedMarketplace}
                onMarketplaceChange={onMarketplaceChange}
            />
        );
    }

    // Starter: simple marketplace selector + upgrade prompt
    return (
        <div className="space-y-2">
            <MarketplaceSelector
                value={marketplaceValue}
                onChange={onMarketplaceValueChange || (() => {})}
            />
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Lock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Pro Feature
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                        Account selection lets you pick a specific Seller Central account and
                        marketplace. The extension switches automatically before each run.
                        Available on Pro &amp; Business plans.
                    </p>
                </div>
            </div>
        </div>
    );
};
