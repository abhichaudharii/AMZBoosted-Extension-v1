import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

interface NicheXOptions {
    marketplace: string;
    asinList: string[]; // Generic inputs mapped
    runId?: string;
    delay?: number;
    autoRetry?: boolean;
    outputFormat?: string;
    slowMode?: boolean;
    smartScrape?: boolean;
}

interface NicheMetrics {
    nicheId: string;
    obfuscatedMarketplaceId: string;
    nicheTitle: string;
    referenceAsinImageUrl: string;
    currency: string;
    nicheSummary: {
        searchVolumeT90: number;
        searchVolumeGrowthT90: number;
        searchVolumeT360: number;
        searchVolumeGrowthT180: number;
        searchVolumeGrowthT360: number;
        minimumUnitsSoldT90: number;
        maximumUnitsSoldT90: number;
        minimumUnitsSoldT360: number;
        maximumUnitsSoldT360: number;
        minimumAverageUnitsSoldT360: number;
        maximumAverageUnitsSoldT360: number;
        minimumPrice: number;
        maximumPrice: number;
        salesPotentialScore: number;
        productCount: number;
        avgPrice: number;
        avgPriceT360: number;
        demand: string;
        category: string;
        nicheType: string;
        returnRateT360: number;
    };
    topSearchTermMetrics: Array<{
        searchTerm: string;
    }>;
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
};

class NicheXService {
    private activeRuns = new Map<string, boolean>();

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getMarketplaceId(marketplace: string): string | null {
        return marketplaceMap[marketplace.toLowerCase()] || null;
    }

    private formatData(input: string, nicheDataList: NicheMetrics[]) {
        return nicheDataList.map(nicheData => {
            const dataDict: any = {
                "ASIN/Keyword": input,
                "Niche ID": nicheData.nicheId,
                "Customer Need": nicheData.nicheTitle,
                "Category": nicheData.nicheSummary.category,
                "Currency": nicheData.currency,
                "Top Search Term 1": "",
                "Top Search Term 2": "",
                "Top Search Term 3": "",
                "Search Volume (Past 360 days)": nicheData.nicheSummary.searchVolumeT360,
                "Search Volume Growth (Past 180 days)": nicheData.nicheSummary.searchVolumeGrowthT180,
                "Search Volume (Past 90 days)": nicheData.nicheSummary.searchVolumeT90,
                "Search Volume Growth (Past 90 days)": nicheData.nicheSummary.searchVolumeGrowthT90,
                "Demand": nicheData.nicheSummary.demand,
                "Units Sold Lower Bound (Past 90 days)": nicheData.nicheSummary.minimumUnitsSoldT90,
                "Units Sold Upper Bound (Past 90 days)": nicheData.nicheSummary.maximumUnitsSoldT90,
                "Units Sold Lower Bound (Past 360 days)": nicheData.nicheSummary.minimumUnitsSoldT360,
                "Units Sold Upper Bound (Past 360 days)": nicheData.nicheSummary.maximumUnitsSoldT360,
                "Average Units Sold Lower Bound (Past 360 days)": nicheData.nicheSummary.minimumAverageUnitsSoldT360,
                "Average Units Sold Upper Bound (Past 360 days)": nicheData.nicheSummary.maximumAverageUnitsSoldT360,
                "# of Top Clicked Products": nicheData.nicheSummary.productCount,
                "Average Price": nicheData.nicheSummary.avgPriceT360,
                "Minimum Price (Past 360 days)": nicheData.nicheSummary.minimumPrice,
                "Maximum Price (Past 360 days)": nicheData.nicheSummary.maximumPrice,
                "Return Rate (Past 360 days)": (nicheData.nicheSummary.returnRateT360 * 100).toFixed(2)
            };

            const topSearchTerms = nicheData.topSearchTermMetrics || [];
            const topSearchTermsLimited = topSearchTerms.slice(0, 3);
            topSearchTermsLimited.forEach((term, index) => {
                dataDict[`Top Search Term ${index + 1}`] = term.searchTerm;
            });
            return dataDict;
        });
    }

    private getBaseDomain(): string {
        return "sellercentral.amazon.com";
    }

    private async getNicheViewData(marketPlaceId: string, input: string, searchAsAsin: boolean): Promise<NicheMetrics[]> {
        const baseDomain = this.getBaseDomain();

        let asinSearchFilter: any = {
            asinId: input,
            multiSelectFilters: [],
            obfuscatedMarketplaceId: marketPlaceId,
            rangeFilters: [],
        };

        if (!searchAsAsin) {
            asinSearchFilter = {
                obfuscatedMarketplaceId: marketPlaceId,
                searchTermsFilter: {
                    searchInput: input,
                }
            };
        }

        const query = `query getNiches($filter: NicheFilter!, $useNewQuery: Boolean, $searchImprovementsEnabled: Boolean) {
  niches(
    filter: $filter
    useNewQuery: $useNewQuery
    searchImprovementsEnabled: $searchImprovementsEnabled
  ) {
    nicheId
    obfuscatedMarketplaceId
    nicheTitle
    referenceAsinImageUrl
    currency
    nicheSummary {
      searchVolumeT90
      searchVolumeGrowthT90
      searchVolumeT360
      searchVolumeGrowthT180
      searchVolumeGrowthT360
      minimumUnitsSoldT90
      maximumUnitsSoldT90
      minimumUnitsSoldT360
      maximumUnitsSoldT360
      minimumAverageUnitsSoldT360
      maximumAverageUnitsSoldT360
      minimumPrice
      maximumPrice
      salesPotentialScore
      productCount
      avgPrice
      avgPriceT360
      demand
      category
      nicheType
      returnRateT360
      __typename
    }
    topSearchTermMetrics {
      searchTerm
      __typename
    }
    __typename
  }
}`;

        const jsonPayload = {
            query,
            operationName: 'getNiches',
            variables: {
                filter: asinSearchFilter,
                useNewQuery: true,
                searchImprovementsEnabled: true,
            },
        };

        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;

        // 1. Get CSRF Token
        const csrfResponse = await fetch(csrfUrl, { method: 'GET' });
        const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');

        if (!csrfToken) {
            throw new Error("AUTH_FAILED: Failed to retrieve CSRF token. Please ensure you are logged into Seller Central.");
        }

        // 2. Post Data
        const response = await fetch(csrfUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anti-csrftoken-a2z': csrfToken,
            },
            body: JSON.stringify(jsonPayload),
        });

        if (response.ok) {
            const responseData = await response.json();
            const niches = responseData.data?.niches || [];

            // Retry logic: If searched as ASIN and got nothing, try as keyword
            if (searchAsAsin && niches.length === 0) {
                return this.getNicheViewData(marketPlaceId, input, false);
            }
            return niches;
        } else {
            // If failed as ASIN, try as keyword before giving up? 
            // The original JS logic only recurses on empty success response OR error? 
            // Looking at original JS: 
            // if (response.ok) { ... if (searchASIN === true && length == 0) recurse... } 
            // else { if (searchASIN === true) recurse... }

            if (searchAsAsin) {
                return this.getNicheViewData(marketPlaceId, input, false);
            }
            throw new Error(`Failed to fetch Niche data: ${response.status}`);
        }
    }

    async execute(
        _urls: string[] | null,
        options: NicheXOptions,
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

        console.log(`[NicheX] Starting for ${total} inputs. Market: ${marketplace}`);

        try {
            for (const input of inputs) {
                if (runId && !this.activeRuns.get(runId)) break;

                // Validate Input: Check if it looks like an ASIN (starts with B0, 10 chars)
                // Niche Explorer is primarily a keyword tool. Although regex could match some keywords, 10-char alphanum starting with B is highly likely an ASIN.
                if (/^[A-Z0-9]{10}$/.test(input) && input.startsWith('B')) {
                    const msg = `Skipped: "${input}" looks like an ASIN. Niche Explorer requires Search Terms/Keywords.`;
                    console.warn(`[NicheX] ${msg}`);
                    errors.push(`${input}: Input is an ASIN (Keywords required)`);
                    onProgress({
                        total,
                        completed,
                        currentUrl: input,
                        statusMessage: msg
                    });
                    completed++;
                    continue;
                }

                // Delay
                if (completed > 0 && delay > 0) {
                    onProgress({
                        total,
                        completed,
                        currentUrl: input,
                        statusMessage: `Waiting ${delay / 1000}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                    });
                    await this.delay(delay);
                }

                if (runId && !this.activeRuns.get(runId)) break;

                // Process
                onProgress({
                    total,
                    completed,
                    currentUrl: input,
                    statusMessage: `Processing "${input}"...`
                });

                try {
                    const data = await this.getNicheViewData(marketId, input, true);
                    if (data && data.length > 0) {
                        const formatted = this.formatData(input, data);
                        allDataList.push(...formatted);
                        successfulCount++;
                    } else {
                        console.warn(`[NicheX] No data for ${input}`);
                    }
                } catch (e: any) {
                    console.error(`[NicheX] Error for ${input}:`, e);
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
                    const excelData = generateExcel(allDataList, 'Niche Data');
                    preGeneratedContent = excelData.content;
                    mimeType = excelData.mimeType;
                }

                await downloadService.downloadTaskResults({
                    taskId: runId,
                    toolId: 'niche-x',
                    toolName: 'Niche Explorer',
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

export const nicheXService = new NicheXService();
