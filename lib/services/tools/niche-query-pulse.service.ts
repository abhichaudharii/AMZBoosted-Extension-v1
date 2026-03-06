
import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

interface NicheQueryPulseOptions {
    marketplace: string;
    asinList: string[]; // Standardized input list (can be ASINs or keywords)
    outputFormat?: string;
    runId?: string;
    delay?: number;
    slowMode?: boolean;
}



class NicheQueryPulseService {
    private activeRuns = new Map<string, boolean>();

    stop(runId: string) {
        this.activeRuns.set(runId, false);
    }

    private getMarketPlaceId(mp: string): string {
        const map: Record<string, string> = {
            us: "ATVPDKIKX0DER",
            uk: "A1F83G8C2ARO7P",
            gb: "A1F83G8C2ARO7P",
            de: "A1PA6795UKMFR9",
            fr: "A13V1IB3VIYZZH",
            it: "APJ6JRA9NG5V4",
            es: "A1RKKUPIHCS9HS",
            jp: "A1VC38T7YXB528"
        };
        return map[mp.toLowerCase()] || "ATVPDKIKX0DER";
    }

    private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    private async getCsrfToken(baseDomain: string): Promise<string> {
        try {
            const res = await this.fetchWithTimeout(`https://${baseDomain}/ox-api/graphql`, {
                method: "GET",
                credentials: "include"
            }, 5000);
            return res.headers.get("anti-csrftoken-a2z") || '';
        } catch (e) {
            console.warn("Failed to get CSRF token", e);
            return '';
        }
    }

    private isASIN(val: string): boolean {
        return /^[A-Z0-9]{10}$/.test(val.trim());
    }

    private async axSearch(baseDomain: string, marketPlaceId: string, text: string, csrf: string): Promise<any[]> {
        const payload = {
            query: `
            query axSearchQuery($obfuscatedMarketplaceId: String!, $searchText: String!, $pageSize: Int) {
              axSearch(
                obfuscatedMarketplaceId: $obfuscatedMarketplaceId
                searchText: $searchText
                pageSize: $pageSize
              ) {
                searchResults
              }
            }`,
            operationName: "axSearchQuery",
            variables: {
                obfuscatedMarketplaceId: marketPlaceId,
                searchText: text,
                pageSize: 10
            }
        };

        try {
            const r = await this.fetchWithTimeout(`https://${baseDomain}/ox-api/graphql`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "anti-csrftoken-a2z": csrf
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
            }

            const j = await r.json();
            return j?.data?.axSearch?.searchResults || [];
        } catch (e: any) {
            console.error("AxSearch failed", e);
            if (e.message && e.message.includes('AUTH_FAILED')) {
                throw e; // Propagate auth errors
            }
            return [];
        }
    }

    private async searchNiches(baseDomain: string, marketPlaceId: string, text: string, csrf: string): Promise<any[]> {
        const payload = {
            query: `
            query searchNicheSearchTerms($input: SearchNicheRequest) {
              searchNiches(request: $input) {
                hits {
                  searchTerm
                  nicheHits {
                    nicheId
                    obfuscatedMarketplaceId
                  }
                }
              }
            }`,
            operationName: "searchNicheSearchTerms",
            variables: {
                input: {
                    obfuscatedMarketplaceId: marketPlaceId,
                    partialSearchTerm: text,
                    pageSize: 10
                }
            }
        };

        try {
            const r = await this.fetchWithTimeout(`https://${baseDomain}/ox-api/graphql`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "anti-csrftoken-a2z": csrf
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
            }

            const j = await r.json();
            return j?.data?.searchNiches?.hits || [];
        } catch (e: any) {
            console.error("SearchNiches failed", e);
            if (e.message && e.message.includes('AUTH_FAILED')) {
                throw e; // Propagate auth errors
            }
            return [];
        }
    }

    private async getNicheDetails(baseDomain: string, marketPlaceId: string, nicheId: string, csrf: string): Promise<any> {
        const payload = {
            query: `
            query getNiche($input: NicheInput!) {
              niche(request: $input) {
                nicheTitle
                nicheSummary {
                  searchVolumeT360
                  avgPriceT360
                  productCount
                  returnRateT360
                }
                searchTermMetrics {
                  searchTerm
                  searchVolumeT360
                  searchConversionRateT360
                  clickShare
                  topClickedProducts {
                    asin
                    asinTitle
                  }
                }
              }
            }`,
            operationName: "getNiche",
            variables: {
                input: {
                    nicheId,
                    obfuscatedMarketplaceId: marketPlaceId
                }
            }
        };

        try {
            const r = await this.fetchWithTimeout(`https://${baseDomain}/ox-api/graphql`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "anti-csrftoken-a2z": csrf
                },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
            }

            const j = await r.json();
            return j?.data?.niche;
        } catch (e: any) {
            console.error("GetNicheDetails failed", e);
            if (e.message && e.message.includes('AUTH_FAILED')) {
                throw e; // Propagate auth errors
            }
            return null;
        }
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async execute(
        _urls: string[] | null,
        options: NicheQueryPulseOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { asinList, marketplace, runId, delay = 2000 } = options;
        const marketPlaceId = this.getMarketPlaceId(marketplace);
        const baseDomain = "sellercentral.amazon.com";

        // Get CSRF Token
        const csrf = await this.getCsrfToken(baseDomain);
        if (!csrf) {
            throw new Error("Failed to retrieve CSRF token. Please ensure you are logged into Seller Central.");
        }

        const validInputs = asinList.filter(input => input && input.trim().length > 0);
        const allNicheDetails: any[] = [];
        const processedNicheIds = new Set<string>();
        let processedCount = 0;

        for (let i = 0; i < validInputs.length; i++) {
            const input = validInputs[i].trim();

            onProgress({
                total: validInputs.length,
                completed: processedCount,
                currentUrl: input,
                statusMessage: `Finding niches for "${input}"...`
            });

            try {
                let nicheHits = [];
                if (this.isASIN(input)) {
                    // It's likely an ASIN, define axSearch then searchNiches
                    // But standard logic from JS: if isASIN, check axSearch first.
                    const asinSearch = await this.axSearch(baseDomain, marketPlaceId, input, csrf);
                    if (asinSearch.length > 0) {
                        nicheHits = await this.searchNiches(baseDomain, marketPlaceId, input, csrf);
                    }
                } else {
                    // Keyword
                    nicheHits = await this.searchNiches(baseDomain, marketPlaceId, input, csrf);
                }

                // Collect unique niches from hits
                const uniqueNichesForInput = new Map();
                nicheHits.forEach((h: any) =>
                    h.nicheHits.forEach((n: any) =>
                        uniqueNichesForInput.set(n.nicheId, n)
                    )
                );

                if (uniqueNichesForInput.size === 0) {
                    // No niches found for this input
                    continue;
                }

                // Process unique niches
                for (const niche of uniqueNichesForInput.values()) {
                    if (processedNicheIds.has(niche.nicheId)) continue;
                    processedNicheIds.add(niche.nicheId);

                    onProgress({
                        total: validInputs.length,
                        completed: processedCount,
                        currentUrl: input,
                        statusMessage: `Getting details for niche: ${niche.nicheId}...`
                    });

                    await this.delay(1000); // polite delay

                    const details = await this.getNicheDetails(baseDomain, niche.obfuscatedMarketplaceId, niche.nicheId, csrf);
                    if (details) {
                        // Enrich details with Niche ID
                        allNicheDetails.push({ ...details, nicheId: niche.nicheId, sourceInput: input });
                    }
                }

            } catch (err: any) {
                console.error(`Error processing ${input}:`, err);

                if (err.message && (err.message.includes('AUTH_FAILED') || err.message.includes('Session expired'))) {
                    onProgress({
                        total: validInputs.length,
                        completed: processedCount,
                        currentUrl: input,
                        statusMessage: `Stopped due to Auth Failure: ${err.message}`
                    });
                    if (runId) this.activeRuns.set(runId, false); // Stop further signal
                    break; // Break loop
                }
            }

            processedCount++;
            if (i < validInputs.length - 1) {
                await this.delay(delay);
            }
        }

        // Prepare Results for Export
        // Flatten output: One row per Search Term per Niche
        const flattenedResults: any[] = [];
        for (const niche of allNicheDetails) {
            if (niche.searchTermMetrics && Array.isArray(niche.searchTermMetrics)) {
                for (const metric of niche.searchTermMetrics) {
                    const topProducts = metric.topClickedProducts?.map((p: any) => `${p.asin} (${p.asinTitle})`).join('; ') || '';
                    flattenedResults.push({
                        "Input": niche.sourceInput,
                        "Niche Title": niche.nicheTitle,
                        "Niche ID": niche.nicheId,
                        "Search Term": metric.searchTerm,
                        "Search Volume (T360)": metric.searchVolumeT360,
                        "Conversion Rate (T360)": metric.searchConversionRateT360,
                        "Click Share": metric.clickShare,
                        "Top Clicked Products": topProducts
                    });
                }
            } else {
                // Niche without specific metrics but maybe summary?
                flattenedResults.push({
                    "Input": niche.sourceInput,
                    "Niche Title": niche.nicheTitle,
                    "Niche ID": niche.nicheId,
                    "Search Term": "N/A - Summary Only",
                    "Search Volume (T360)": niche.nicheSummary?.searchVolumeT360,
                    "Conversion Rate (T360)": "N/A",
                    "Click Share": "N/A",
                    "Top Clicked Products": ""
                });
            }
        }


        // Handle Download if we have results and a runId
        if (flattenedResults.length > 0 && runId) {
            const format = options.outputFormat || 'excel';
            let preGeneratedContent;
            let mimeType;
            let extension = 'csv';

            if (format === 'xlsx' || format === 'excel') {
                const excelData = generateExcel(flattenedResults, 'Niche Query Pulse Data');
                preGeneratedContent = excelData.content;
                mimeType = excelData.mimeType;
                extension = 'xlsx';
            } else if (format === 'json') {
                preGeneratedContent = JSON.stringify(flattenedResults, null, 2);
                mimeType = 'application/json';
                extension = 'json';
            } else {
                // CSV default (handled by generic or if we need specific string)
                // If downloadService handles CSV from object array automatically, we can skip manual CSV string generation here
                // assuming downloadService takes the raw data object for CSV.
                mimeType = 'text/csv';
                extension = 'csv';
            }

            await downloadService.downloadTaskResults({
                taskId: runId,
                toolId: 'niche-query-pulse',
                toolName: 'Niche Query Pulse',
                marketplace: options.marketplace,
                data: flattenedResults,
                source: 'quick_run',
                format: extension as any,
                preGeneratedContent,
                mimeType
            });
        }

        return {
            results: flattenedResults,
            processedCount,
            successful: flattenedResults.length,
            failed: 0 // We don't track per-item failure strictly here as one input generates multiple outputs
        };
    }
}

export const nicheQueryPulseService = new NicheQueryPulseService();
