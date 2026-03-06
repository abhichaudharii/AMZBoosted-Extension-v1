export interface GlobalAccount {
    id: string;
    label: string;
    selected: boolean;
}

export interface Marketplace {
    id: string;
    label: string;
    countryCode: string;
    domain: string | null;
    ids?: {
        mons_sel_mkid?: string;
        mons_sel_dir_mcid?: string;
        [key: string]: any;
    };
    globalAccountId?: string;
    selected?: boolean;
}

// Comprehensive list of supported marketplaces
const DEFAULT_MARKETPLACES: Partial<Marketplace>[] = [
    { id: 'US', label: 'United States', countryCode: 'US', domain: 'amazon.com' },
    { id: 'UK', label: 'United Kingdom', countryCode: 'GB', domain: 'amazon.co.uk' },
    { id: 'CA', label: 'Canada', countryCode: 'CA', domain: 'amazon.ca' },
    { id: 'IN', label: 'India', countryCode: 'IN', domain: 'amazon.in' },
    { id: 'DE', label: 'Germany', countryCode: 'DE', domain: 'amazon.de' },
    { id: 'FR', label: 'France', countryCode: 'FR', domain: 'amazon.fr' },
    { id: 'IT', label: 'Italy', countryCode: 'IT', domain: 'amazon.it' },
    { id: 'ES', label: 'Spain', countryCode: 'ES', domain: 'amazon.es' },
    { id: 'AU', label: 'Australia', countryCode: 'AU', domain: 'amazon.com.au' },
    { id: 'BE', label: 'Belgium', countryCode: 'BE', domain: 'amazon.com.be' },
    { id: 'BR', label: 'Brazil', countryCode: 'BR', domain: 'amazon.com.br' },
    { id: 'EG', label: 'Egypt', countryCode: 'EG', domain: 'amazon.eg' },
    { id: 'IE', label: 'Ireland', countryCode: 'IE', domain: 'amazon.ie' },
    { id: 'JP', label: 'Japan', countryCode: 'JP', domain: 'amazon.co.jp' },
    { id: 'MX', label: 'Mexico', countryCode: 'MX', domain: 'amazon.com.mx' },
    { id: 'NL', label: 'Netherlands', countryCode: 'NL', domain: 'amazon.nl' },
    { id: 'PL', label: 'Poland', countryCode: 'PL', domain: 'amazon.pl' },
    { id: 'SA', label: 'Saudi Arabia', countryCode: 'SA', domain: 'amazon.sa' },
    { id: 'SG', label: 'Singapore', countryCode: 'SG', domain: 'amazon.sg' },
    { id: 'ZA', label: 'South Africa', countryCode: 'ZA', domain: 'amazon.co.za' },
    { id: 'SE', label: 'Sweden', countryCode: 'SE', domain: 'amazon.se' },
    { id: 'TR', label: 'Turkey', countryCode: 'TR', domain: 'amazon.com.tr' },
    { id: 'AE', label: 'United Arab Emirates', countryCode: 'AE', domain: 'amazon.ae' },
];

class AccountService {
    async fetchGlobalAccounts(): Promise<GlobalAccount[]> {
        try {
            const response = await fetch("https://sellercentral.amazon.com/account-switcher/global-accounts?", {
                headers: {
                    "accept": "application/json",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "priority": "u=1, i",
                },
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.globalAccounts) {
                return data.globalAccounts.map((acc: any) => ({
                    id: acc.id,
                    label: acc.label,
                    selected: acc.selected
                }));
            }

            return [];
        } catch (error) {
            console.error('Error fetching global accounts:', error);
            return [];
        }
    }

    async fetchMarketplaces(globalAccountId: string): Promise<Marketplace[]> {
        try {
            const url = `https://sellercentral.amazon.com/account-switcher/regional-accounts/merchantMarketplace?globalAccountId=${encodeURIComponent(globalAccountId)}&vendorCentralMigration=T1`;

            const response = await fetch(url, {
                headers: {
                    "accept": "application/json",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "priority": "u=1, i",
                },
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.regionalAccounts) {
                return data.regionalAccounts
                    .filter((acc: any) => {
                        const label = acc.label || '';
                        // Filter out pending registration
                        return !label.toLowerCase().includes('pending registration') &&
                            !label.toLowerCase().includes('sc_hub_pending_reg');
                    })
                    .map((acc: any) => ({
                        id: acc.ids?.mons_sel_mkid || acc.ids?.mons_sel_dir_mcid,
                        ids: acc.ids,
                        label: acc.label,
                        countryCode: this.getCountryCodeFromDomain(acc.domain, acc.label),
                        domain: acc.domain,
                        selected: acc.selected,
                        globalAccountId: acc.globalAccountId
                    }))
                    .sort((a: any, b: any) => a.label.localeCompare(b.label));
            }

            // Fallback if no regional accounts returned
            return DEFAULT_MARKETPLACES.map(m => ({
                id: m.id || '',
                ids: {},
                label: m.label || '',
                countryCode: m.countryCode || 'US',
                domain: m.domain || null,
                selected: false
            })) as Marketplace[];

        } catch (error) {
            console.error('Error fetching marketplaces:', error);
            // Fallback on error
            return DEFAULT_MARKETPLACES.map(m => ({
                id: m.id || '',
                ids: {},
                label: m.label || '',
                countryCode: m.countryCode || 'US',
                domain: m.domain || null,
                selected: false
            })) as Marketplace[];
        }
    }

    async switchAccount(merchantId: string, marketplaceId: string, partnerAccountId: string): Promise<boolean> {
        // Construct the switch URL
        // Example: https://sellercentral.amazon.com/home?mons_sel_mkid=...&mons_sel_dir_mcid=...&mons_sel_dir_paid=...&ignore_selection_changed=true

        try {
            const params = new URLSearchParams({
                mons_sel_mkid: marketplaceId,
                mons_sel_dir_mcid: merchantId,
                mons_sel_dir_paid: partnerAccountId,
                ignore_selection_changed: 'true'
            });

            const url = `https://sellercentral.amazon.com/home?${params.toString()}`;

            // We perform a fetch to this URL to trigger the switch on the server session
            // Note: This relies on the browser's cookie jar being shared with this fetch request (credentials: include)
            // However, normally switching involves a navigation or a specific API call. 
            // The logic from `child_asin_downloader.js` suggests checking `global-and-regional-account` endpoint after switch.
            // But let's try the direct home hit first or the API used by the switcher UI if discoverable.
            // Based on the text file, the URL is constructed for usage, but is there an API?
            // The text file says "we can the make below request to confirm newly selected account".
            // It implies accessing that URL executes the switch.

            // Let's try to hit it via HEAD or GET request.
            await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            // Verify the switch
            const verifyUrl = "https://sellercentral.amazon.com/account-switcher/global-and-regional-account/merchantMarketplace?";
            const verifyResponse = await fetch(verifyUrl, {
                headers: {
                    "accept": "application/json",
                },
                method: "GET",
                credentials: "include"
            });

            if (!verifyResponse.ok) return false;

            const verifyData = await verifyResponse.json();
            // Check if the selected marketplace matches what we requested
            // verifyData.regionalAccount.ids.mons_sel_mkid should match marketplaceId
            if (verifyData?.regionalAccount?.ids?.mons_sel_mkid === marketplaceId) {
                return true;
            }

            return false;

        } catch (error) {
            console.error('Account switch failed:', error);
            return false;
        }
    }

    private getCountryCodeFromDomain(domain: string | null, label: string): string {
        const cleanLabel = label.split('(')[0].trim();

        if (!domain) {
            const labelMap: Record<string, string> = {
                'United States': 'US', 'Canada': 'CA', 'Mexico': 'MX', 'Brazil': 'BR',
                'United Kingdom': 'GB', 'Germany': 'DE', 'France': 'FR', 'Italy': 'IT',
                'Spain': 'ES', 'Netherlands': 'NL', 'Sweden': 'SE', 'Poland': 'PL',
                'Turkey': 'TR', 'Japan': 'JP', 'Australia': 'AU', 'India': 'IN',
                'Belgium': 'BE', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE',
                'Egypt': 'EG', 'Singapore': 'SG'
            };
            return labelMap[cleanLabel] || 'US';
        }

        if (domain.endsWith('.com')) return 'US';
        if (domain.endsWith('.co.uk')) return 'GB';
        if (domain.endsWith('.de')) return 'DE';
        if (domain.endsWith('.fr')) return 'FR';
        if (domain.endsWith('.it')) return 'IT';
        if (domain.endsWith('.es')) return 'ES';
        if (domain.endsWith('.ca')) return 'CA';
        if (domain.endsWith('.mx')) return 'MX';
        if (domain.endsWith('.com.br')) return 'BR';
        if (domain.endsWith('.co.jp')) return 'JP';
        if (domain.endsWith('.com.au')) return 'AU';
        if (domain.endsWith('.in')) return 'IN';
        if (domain.endsWith('.nl')) return 'NL';
        if (domain.endsWith('.se')) return 'SE';
        if (domain.endsWith('.pl')) return 'PL';
        if (domain.endsWith('.com.tr')) return 'TR';
        if (domain.endsWith('.ae')) return 'AE';
        if (domain.endsWith('.sa')) return 'SA';
        if (domain.endsWith('.sg')) return 'SG';
        if (domain.endsWith('.com.be')) return 'BE';
        if (domain.endsWith('.eg')) return 'EG';

        return 'US';
    }
}

export const accountService = new AccountService();
