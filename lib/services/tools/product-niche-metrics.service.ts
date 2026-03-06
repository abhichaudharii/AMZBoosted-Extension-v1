import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

interface ProductNicheMetricsOptions {
    marketplace: string;
    asinList: string[];
    runId?: string;
    delay?: number;
    outputFormat?: string;
    autoRetry?: boolean;
    slowMode?: boolean;
    smartScrape?: boolean;
}

// Interfaces mirroring the GraphQL response structure
interface NicheSummary {
    searchVolumeT360: number | string;
    searchVolumeGrowthT180: number;
    minimumAverageUnitsSoldT360: number;
    maximumAverageUnitsSoldT360: number;
    avgPriceT360: number;
    productCount: number | string;
    returnRateT360: number;
    // Add other fields if needed from response
}

interface AsinMetric {
    asin: string;
    asinTitle: string;
    brand: string;
    category: string;
    launchDate: string;
    avgPriceT360: number;
    clickCountT360: number;
    clickShareT360: number;
    totalReviews: number | string;
    customerRating: number | string;
    bestSellersRanking: number | string;
    avgSellerVendorCountT360: number;
}

interface NicheDetail {
    nicheTitle: string;
    nicheSummary: NicheSummary;
    asinMetrics: AsinMetric[];
}

interface NicheViewItem {
    nicheId: string;
    obfuscatedMarketplaceId: string;
    nicheTitle: string;
    nicheSummary: any;
}


const marketplaceMap: Record<string, string> = {
    "us": "ATVPDKIKX0DER",
    "uk": "A1F83G8C2ARO7P",
    "gb": "A1F83G8C2ARO7P",
    "de": "A1PA6795UKMFR9",
    "fr": "A13V1IB3VIYZZH",
    "it": "APJ6JRA9NG5V4",
    "es": "A1RKKUPIHCS9HS",
    "jp": "A1VC38T7YXB528",
    "se": "A2NODRKZP88ZB9",
    "pl": "A1C3SOZRARQ6R3",
    "be": "AMEN7PMS3EDWL",
    "au": "AOZFGU372UMI1",
    "nl": "A1805IZSGTT6HS",
    "mx": "A1AM78C64UM0Y8",
    "ca": "A2EUQ1WTGCTBG2",
    "br": "A2Q3Y263D00KWC",
    "tr": "A33AVAJ2PDY3EV",
    "ae": "A2VIGQ35RCS4UG",
    "in": "A21TJRUUN4KGV",
    "sg": "A19VAU5U5O7RUS",
    "sa": "A17E79C6D8DWNP",
    // Add missing if any
};

class ProductNicheMetricsService {
    private activeRuns = new Map<string, boolean>();

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    private getMarketplaceId(marketplace: string): string | null {
        return marketplaceMap[marketplace.toLowerCase()] || null;
    }

    private getBaseDomain(): string {
        return "sellercentral.amazon.com";
    }

    private getCurrentDate(): string {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();
        return `${month}/${day}/${year}`;
    }

    private async axSearch(marketPlaceId: string, text: string): Promise<any[]> {
        const baseDomain = this.getBaseDomain();
        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;
        try {
            const csrfResponse = await this.fetchWithTimeout(csrfUrl, { method: 'GET' }, 5000);
            const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');
            if (!csrfToken) return [];

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

            const r = await this.fetchWithTimeout(csrfUrl, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "anti-csrftoken-a2z": csrfToken
                },
                body: JSON.stringify(payload)
            }, 10000);

            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
            }

            const j = await r.json();
            return j?.data?.axSearch?.searchResults || [];
        } catch (e: any) {
            if (e.message && e.message.includes('AUTH_FAILED')) {
                throw e; // Propagate auth errors
            }
            return [];
        }
    }

    private async searchNiches(marketPlaceId: string, text: string): Promise<any[]> {
        const baseDomain = this.getBaseDomain();
        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;
        try {
            const csrfResponse = await this.fetchWithTimeout(csrfUrl, { method: 'GET' }, 5000);
            const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');
            if (!csrfToken) return [];

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

            const r = await this.fetchWithTimeout(csrfUrl, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "anti-csrftoken-a2z": csrfToken
                },
                body: JSON.stringify(payload)
            }, 10000);

            if (!r.ok) {
                if (r.status === 401 || r.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
            }

            const j = await r.json();
            return j?.data?.searchNiches?.hits || [];
        } catch (e: any) {
            if (e.message && e.message.includes('AUTH_FAILED')) {
                throw e; // Propagate auth errors
            }
            return [];
        }
    }

    private async getNicheViewData(marketPlaceId: string, input: string, searchAsAsin: boolean): Promise<NicheViewItem[]> {
        const baseDomain = this.getBaseDomain();
        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;

        // 1. Get CSRF Token
        const csrfResponse = await this.fetchWithTimeout(csrfUrl, { method: 'GET' });
        const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');
        if (!csrfToken) throw new Error("Missing CSRF token");

        // 2. Build Payload
        let filter;
        if (searchAsAsin) {
            filter = {
                obfuscatedMarketplaceId: marketPlaceId,
                asinId: input,
                rangeFilters: [],
                multiSelectFilters: []
            };
        } else {
            filter = {
                obfuscatedMarketplaceId: marketPlaceId,
                searchTermsFilter: {
                    searchInput: input
                }
            };
        }

        const payload = {
            query: `
            query getNiches($filter: NicheFilter!, $useNewQuery: Boolean) {
              niches(filter: $filter, useNewQuery: $useNewQuery) {
                nicheId
                obfuscatedMarketplaceId
                nicheTitle
                referenceAsinImageUrl
                currency
                nicheSummary {
                searchVolumeT360
                searchVolumeGrowthT180
                minimumAverageUnitsSoldT360
                maximumAverageUnitsSoldT360
                productCount
                avgPriceT360
                returnRateT360
                }
            }
            }`,
            operationName: "getNiches",
            variables: {
                filter,
                useNewQuery: true
            }
        };

        const response = await this.fetchWithTimeout(csrfUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anti-csrftoken-a2z': csrfToken
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (searchAsAsin) {
                // Retry as keyword if ASIN fails
                return this.getNicheViewData(marketPlaceId, input, false);
            }
            throw new Error(`Failed niche lookup: ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.niches || [];
    }

    private async getNicheDetails(marketPlaceId: string, nicheDetailsId: string): Promise<NicheDetail> {
        const baseDomain = this.getBaseDomain();
        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;

        const csrfResponse = await this.fetchWithTimeout(csrfUrl, { method: 'GET' });
        const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');
        if (!csrfToken) throw new Error("Missing CSRF token");

        const payload = {
            query: `
            query getNiche($nicheInput: NicheInput!) {
              niche(request: $nicheInput) {
                nicheTitle
                nicheSummary {
                  searchVolumeT360
                  searchVolumeGrowthT180
                  minimumAverageUnitsSoldT360
                  maximumAverageUnitsSoldT360
                  avgPriceT360
                  productCount
                  returnRateT360
                }
                asinMetrics(request: $nicheInput) {
                  asin
                  asinTitle
                  brand
                  category
                  launchDate
                  avgPriceT360
                  clickCountT360
                  clickShareT360
                  totalReviews
                  customerRating
                  bestSellersRanking
                  avgSellerVendorCountT360
                }
              }
            }`,
            operationName: "getNiche",
            variables: {
                nicheInput: {
                    nicheId: nicheDetailsId,
                    obfuscatedMarketplaceId: marketPlaceId
                }
            }
        };

        const response = await this.fetchWithTimeout(csrfUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anti-csrftoken-a2z': csrfToken
            },
            body: JSON.stringify(payload)
        }, 30000); // Allow longer timeout for details

        if (!response.ok) {
            throw new Error(`Failed niche details fetch: ${response.status}`);
        }

        const data = await response.json();
        return data?.data?.niche;
    }

    private filterNicheDetails(inputAsin: string, nicheName: string, nicheDetails: NicheDetail) {
        const results: any[] = [];
        const summary = nicheDetails.nicheSummary || {};
        const asinMetrics = nicheDetails.asinMetrics || [];

        asinMetrics.forEach(a => {
            results.push({
                "ASIN/Keyword": inputAsin,
                "Niche Name": nicheName,
                "Last Updated": this.getCurrentDate(),
                "Product Name": a.asinTitle || "",
                "ASIN": a.asin || "",
                "Brand": a.brand || "",
                "Category": a.category || "",
                "Launch Date": a.launchDate || "",
                "Niche Click Count (Past 360 days)": a.clickCountT360 ?? "",
                "Click Share (Past 360 days)": a.clickShareT360 ?? "",
                "Average Selling Price (Past 360 days)": a.avgPriceT360 ?? "",
                "Total Ratings": a.totalReviews ?? "",
                "Average Customer Rating": a.customerRating ?? "",
                "Average BSR": a.bestSellersRanking ?? "",
                "Average # of Sellers (Past 360 days)": a.avgSellerVendorCountT360 ?? "",
                "Search Vol (past 360 days)": summary.searchVolumeT360 ?? "",
                "Search Vol Growth (Past 180 days)": summary.searchVolumeGrowthT180 ?? "",
                "# of Top Clicked Products": summary.productCount ?? "",
                "Average Price (Past 360 Days)": summary.avgPriceT360 ?? "",
                "Avg Units Sold (Lower Bound)": summary.minimumAverageUnitsSoldT360 ?? "",
                "Avg Units Sold (Upper Bound)": summary.maximumAverageUnitsSoldT360 ?? "",
                "Return Rate (Past 360 Days)": summary.returnRateT360 != null
                    ? (summary.returnRateT360 * 100).toFixed(2)
                    : ""
            });
        });

        return results;
    }

    private async extractAllNicheDetails(
        inputAsin: string,
        nicheDataList: NicheViewItem[],
        runId: string | undefined,
        onProgress: (msg: string, completed?: number, total?: number) => void
    ): Promise<any[]> {
        const newNicheDetailsList: any[] = [];

        for (let index = 0; index < nicheDataList.length; index++) {
            if (runId && !this.activeRuns.get(runId)) break;

            const nicheData = nicheDataList[index];
            const marketPlaceId = nicheData.obfuscatedMarketplaceId;
            const nicheDetailsId = nicheData.nicheId;
            const nicheName = nicheData.nicheTitle;

            onProgress(`Processing niche ${index + 1}/${nicheDataList.length}: ${nicheName}`, index + 1, nicheDataList.length);

            try {
                const nicheDetails = await this.getNicheDetails(marketPlaceId, nicheDetailsId);
                if (nicheDetails) {
                    newNicheDetailsList.push(...this.filterNicheDetails(inputAsin, nicheName, nicheDetails));
                }
            } catch (e: any) {
                console.error(`Error fetching detail for niche ${nicheName}:`, e);
                if (e.message && e.message.includes('AUTH_FAILED')) {
                    throw e; // Propagate critical auth error
                }
            }

            // Delay between requests to be polite (2s as per original script)
            if (index < nicheDataList.length - 1) {
                // If options.slowMode is not available in this scope, we can't show it here easily unless we pass it down.
                // But extractAllNicheDetails doesn't take options.
                // We'll leave it simple or update signature. 
                // Let's stick to simple "Processing..." update from line 397 for now as this is inner loop.
                await this.delay(2000);
            }
        }

        return newNicheDetailsList;
    }

    async execute(
        _urls: string[] | null,
        options: ProductNicheMetricsOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { asinList, marketplace, runId, delay = 2000 } = options;
        if (runId) this.activeRuns.set(runId, true);

        const marketId = this.getMarketplaceId(marketplace);
        if (!marketId) {
            return { success: false, results: [], errors: ["Invalid marketplace"], total: 0, processedCount: 0 };
        }

        // Parse inputs
        let inputs: string[] = [];
        if (Array.isArray(asinList)) {
            inputs = asinList;
        } else if (typeof asinList === 'string') {
            inputs = (asinList as string).split('\n').map(s => s.trim()).filter(Boolean);
        }

        const total = inputs.length;
        let completed = 0;
        let successfulCount = 0;
        const allDataList: any[] = [];
        const errors: string[] = [];

        console.log(`[ProductNicheMetrics] Starting for ${total} inputs. Market: ${marketplace}`);

        try {
            for (const input of inputs) {
                if (runId && !this.activeRuns.get(runId)) break;

                console.log(`[ProductNicheMetrics] Processing input: ${input} (${completed + 1}/${total})`);

                // Overall progress message
                onProgress({
                    total,
                    completed,
                    currentUrl: input,
                    statusMessage: `Looking up niches for "${input}"...`
                });

                try {
                    // Step 1: Parallel Check (ASIN vs Keyword)
                    // Added timeout-protected checks to prevent hanging
                    const [, keywordHits] = await Promise.all([
                        this.axSearch(marketId, input),
                        this.searchNiches(marketId, input)
                    ]);

                    let nicheList: NicheViewItem[] = [];

                    if (keywordHits.length > 0) {
                        // Found keyword hits, treat as keyword search
                        nicheList = await this.getNicheViewData(marketId, input, false);
                    } else {
                        // Default fallback: Try as ASIN
                        nicheList = await this.getNicheViewData(marketId, input, true);
                    }

                    if (nicheList && nicheList.length > 0) {
                        // Step 2: Extract Details (Looping inner niches)
                        // Granular progress reported via callback
                        const detailedData = await this.extractAllNicheDetails(
                            input,
                            nicheList,
                            runId,
                            (msg, subCompleted, subTotal) => {
                                onProgress({
                                    total,
                                    completed,
                                    currentUrl: input,
                                    statusMessage: msg,
                                    subTask: {
                                        completed: subCompleted,
                                        total: subTotal
                                    }
                                });
                            }
                        );

                        if (detailedData.length > 0) {
                            allDataList.push(...detailedData);
                            successfulCount++;
                        }
                    } else {
                        console.warn(`[ProductNicheMetrics] No niches found for ${input}`);
                    }

                    // Main loop delay
                    if (completed < total - 1) {
                        // We can update status to waiting here before loop continues
                        onProgress({
                            total,
                            completed,
                            currentUrl: input,
                            statusMessage: `Waiting ${delay / 1000}s${(options as any).slowMode ? ' (Slow Mode)' : ''}...`
                        });
                        await this.delay(delay);
                    }

                } catch (e: any) {
                    console.error(`[ProductNicheMetrics] Error for ${input}:`, e);
                    errors.push(`Error for ${input}: ${e.message}`);
                }

                completed++;
            }

            // Export
            if (allDataList.length > 0 && runId) {
                const format = options.outputFormat || 'csv';
                let preGeneratedContent;
                let mimeType;

                if (format === 'xlsx' || format === 'excel') {
                    const excelData = generateExcel(allDataList, 'Product Niche Metrics');
                    preGeneratedContent = excelData.content;
                    mimeType = excelData.mimeType;
                }

                await downloadService.downloadTaskResults({
                    taskId: runId,
                    toolId: 'product-niche-metrics',
                    toolName: 'Product Niche Metrics',
                    marketplace: marketplace.toUpperCase(),
                    data: allDataList,
                    source: 'quick_run',
                    format: (format === 'excel' ? 'xlsx' : format) as any,
                    preGeneratedContent,
                    mimeType: mimeType || (format === 'json' ? 'application/json' : 'text/csv')
                });
            }

            return {
                success: allDataList.length > 0,
                results: allDataList,
                processedCount: completed,
                total,
                successful: successfulCount,
                failed: completed - successfulCount,
                errors
            };

        } finally {
            if (runId) this.activeRuns.delete(runId);
        }
    }

    stop(runId: string) {
        this.activeRuns.set(runId, false);
    }
}

export const productNicheMetricsService = new ProductNicheMetricsService();
