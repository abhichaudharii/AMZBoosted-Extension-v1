import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

interface AsinExplorerOptions {
    marketplace: string;
    asinList: string[]; // passed as list or newline separated string in logic? Usually generic options pass 'asinx' as 'urls' or part of options
    delay?: number;
    outputFormat?: 'csv' | 'json' | 'xlsx' | 'excel';
    runId?: string;
    autoRetry?: boolean;
    slowMode?: boolean;
    smartScrape?: boolean;
    asins?: string[];
}

interface AxAsinMetrics {
    obfuscatedMarketplaceId: string;
    asin: string;
    productName: string;
    asinImageUrl: string;
    currency: string;
    brand: string;
    category: string;
    launchDate: string;
    clickCount: number;
    clickCountT360: number;
    averageSellingPriceT90: number;
    averageSellingPriceT360: number;
    totalReviews: number;
    averageCustomerRating: number;
    averageBestSellersRanking: number;
    totalOfferDepthT90: number;
    newOfferAvgDepthT90: number;
    pageViewsT7: number | null;
    pageViewsT7StartDate: string | null;
    pageViewsT7EndDate: string | null;
    pageViewsLatest: number | null;
    pageViewsLatestDate: string | null;
    isExactMatch: boolean;
    __typename: string;
}

const marketplaceMap: Record<string, string> = {
    "us": "ATVPDKIKX0DER",
    "uk": "A1F83G8C2ARO7P",
    "gb": "A1F83G8C2ARO7P", // UK alias
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
    "ca": "A2EUQ1WTGCTBG2", // Added CA? Check if needed, map extended from asinx.js
    "br": "A2Q3Y263D00KWC",
    "tr": "A33AVAJ2PDY3EV",
    "ae": "A2VIGQ35RCS4UG",
    "in": "A21TJRUUN4KGV",
    "sg": "A19VAU5U5O7RUS",
    "sa": "A17E79C6D8DWNP",
};

class AsinExplorerService {
    private activeRuns = new Map<string, boolean>();

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getMarketplaceId(marketplace: string): string | null {
        // Handle variations (e.g. 'com' -> 'us') if needed, for now exact match from map
        return marketplaceMap[marketplace.toLowerCase()] || null;
    }

    private formatData(requestAsin: string, asinDataList: AxAsinMetrics[]) {
        // Should return array of objects matching the desired output structure
        return asinDataList.map(asinData => ({
            "ASIN/Keyword": requestAsin,
            "Product Name": asinData.productName,
            "ASIN": asinData.asin,
            "Brand": asinData.brand,
            "Category": asinData.category,
            "Launch Date": asinData.launchDate,
            "Search Click Count (Past 360 days)": asinData.clickCountT360,
            "Average Selling Price (past 90 days) (USD)": asinData.averageSellingPriceT90,
            "Average Selling Price (past 360 days) (USD)": asinData.averageSellingPriceT360,
            "Total Ratings": asinData.totalReviews,
            "Average Rating": asinData.averageCustomerRating,
            "Average BSR": asinData.averageBestSellersRanking,
            "Average # of Selling Partners": asinData.totalOfferDepthT90,
            "Currency": asinData.currency,
            "Image URL": asinData.asinImageUrl,
            "Page Views (7 Days)": asinData.pageViewsT7,
            "Page Views (Latest)": asinData.pageViewsLatest,
            "Exact Match": asinData.isExactMatch ? 'Yes' : 'No'
        }));
    }

    private getBaseDomain(): string {
        // In extension service worker, we can default to main domain or infer.
        // asinx.js logic relied on chrome.tabs.
        // We'll trust the cookies are available for .amazon.com or the specific region.
        // For simplicity, hardcode simply to sellercentral.amazon.com for now as it usually redirects or works with cross-domain cookies?
        // Actually, for OX API, it usually sits on sellercentral.amazon.com or region-specific.
        // We will try sellercentral.amazon.com first.
        return "sellercentral.amazon.com";
    }

    private async getAsinViewData(marketPlaceId: string, asin: string): Promise<AxAsinMetrics[]> {
        const jsonPayload = {
            query: 'query axGetAsins($filter: AxAsinFilter!) {\n  axAsins(filter: $filter) {\n    obfuscatedMarketplaceId\n    asin\n    productName\n    asinImageUrl\n    currency\n    brand\n    category\n    launchDate\n    clickCount\n    clickCountT360\n    averageSellingPriceT90\n    averageSellingPriceT360\n    totalReviews\n    averageCustomerRating\n    averageBestSellersRanking\n    totalOfferDepthT90\n    newOfferAvgDepthT90\n    pageViewsT7\n    pageViewsT7StartDate\n    pageViewsT7EndDate\n    pageViewsLatest\n    pageViewsLatestDate\n    isExactMatch\n    __typename\n  }\n}',
            operationName: 'axGetAsins',
            variables: {
                filter: {
                    obfuscatedMarketplaceId: marketPlaceId,
                    searchTermsFilter: {
                        searchInput: asin,
                    },
                },
            },
        };

        const baseDomain = this.getBaseDomain();
        const csrfUrl = `https://${baseDomain}/ox-api/graphql`;

        // 1. Get CSRF Token
        const csrfResponse = await fetch(csrfUrl, {
            method: 'GET',
        });

        const csrfToken = csrfResponse.headers.get('anti-csrftoken-a2z');
        if (!csrfToken) {
            console.error("❌ Failed to retrieve anti-csrftoken-a2z header");
            // Fallback: Check if we are not logged in or redirected.
            // Usually this means auth failure.
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

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('AUTH_FAILED: Authentication failed.');
            }
            throw new Error(`Failed to fetch ASIN view data: ${response.status}`);
        }

        const responseData = await response.json();
        return responseData.data?.axAsins || [];
    }

    async execute(
        _urls: string[] | null,
        options: AsinExplorerOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { asinList, marketplace, runId, delay = 2000, outputFormat = 'csv' } = options;

        if (!marketplace) {
            return {
                success: false,
                results: [],
                errors: ["Marketplace is missing."],
                total: 0,
                processedCount: 0,
                successful: 0,
                failed: 0
            };
        }

        const marketId = this.getMarketplaceId(marketplace);
        if (!marketId) {
            return {
                success: false,
                results: [],
                errors: [`Invalid marketplace: ${marketplace}`],
                total: 0,
                processedCount: 0,
                successful: 0,
                failed: 0
            };
        }

        // Parse inputs
        let inputs: string[] = [];
        if (Array.isArray(asinList)) {
            inputs = asinList;
        } else if (typeof asinList === 'string') {
            inputs = (asinList as string).split('\n').map(s => s.trim()).filter(Boolean);
        }

        // Use options.asins if passed (when called from generic wrapper that maps urls->asins)
        if (options['asins'] && Array.isArray(options['asins'])) {
            inputs = options['asins'];
        }

        const total = inputs.length;
        let completed = 0;
        let successfulCount = 0;
        const allDataList: any[] = [];
        const errors: string[] = [];

        if (runId) {
            this.activeRuns.set(runId, true);
        } else {
            // If runId is missing (e.g. manual test), we mock it or proceed without tracking cancellation/download
            console.warn('[AsinExplorer] No runId provided, cancellation and downloads disabled.');
        }

        console.log(`[AsinExplorer] Starting task for ${total} ASINs. Market: ${marketplace}, Delay: ${delay}ms`);

        try {
            for (const asin of inputs) {
                if (runId && !this.activeRuns.get(runId)) break;

                // Validate ASIN
                if (!/^[A-Z0-9]{10}$/.test(asin)) {
                    const msg = `Skipped: "${asin}" is not a valid ASIN.`;
                    console.warn(`[AsinExplorer] ${msg}`);
                    errors.push(`${asin}: Invalid ASIN format`);
                    onProgress({
                        total,
                        completed,
                        currentUrl: asin,
                        statusMessage: msg
                    });
                    completed++;
                    continue;
                }

                // 1. Waiting Phase (Delay)
                const isFirst = inputs.indexOf(asin) === 0;
                let effectiveDelay = delay;

                if (options.slowMode) {
                    // Slow Mode: Min 3s, plus random jitter up to 2s
                    effectiveDelay = Math.max(delay, 3000) + Math.random() * 2000;
                }

                if (!isFirst && effectiveDelay > 0) {
                    onProgress({
                        total,
                        completed,
                        currentUrl: asin,
                        statusMessage: `Waiting ${Math.round(effectiveDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                    });
                    await this.delay(effectiveDelay);
                }

                if (runId && !this.activeRuns.get(runId)) break;

                // 2. Processing Phase with Retry
                const maxRetries = options.autoRetry ? 3 : 1;
                let attempt = 0;
                let success = false;
                let lastError = null;

                while (attempt < maxRetries && !success) {
                    if (runId && !this.activeRuns.get(runId)) break;
                    attempt++;

                    onProgress({
                        total,
                        completed,
                        currentUrl: asin,
                        statusMessage: attempt > 1 ? `Processing "${asin}" (Attempt ${attempt}/${maxRetries})...` : `Fetching data for "${asin}"...`
                    });

                    try {
                        const dataList = await this.getAsinViewData(marketId, asin);
                        if (dataList && dataList.length > 0) {
                            const formatted = this.formatData(asin, dataList);
                            allDataList.push(...formatted);
                            successfulCount++;
                            success = true;
                        } else {
                            console.warn(`[AsinExplorer] No data for ${asin}`);
                            success = true; // No data is valid result
                        }
                    } catch (e: any) {
                        console.error(`[AsinExplorer] Error for ${asin} (Attempt ${attempt}):`, e);
                        lastError = e;

                        if (e.message && (e.message.includes('AUTH_FAILED') || e.message.includes('Session expired'))) {
                            onProgress({
                                total,
                                completed,
                                currentUrl: asin,
                                failed: total - successfulCount,
                                statusMessage: `Stopped due to Auth Failure: ${e.message}`
                            });
                            if (runId) this.activeRuns.set(runId, false);
                            break; // Break Retry Loop
                        }

                        // Smart Scrape Backoff - Retry on error
                        if (options.smartScrape && attempt < maxRetries) {
                            const backoff = 2000 * Math.pow(2, attempt);
                            onProgress({
                                total,
                                completed,
                                currentUrl: asin,
                                statusMessage: `Smart Scrape Error: ${e.message}. Retrying in ${backoff / 1000}s...`
                            });
                            await this.delay(backoff);
                        }
                    }
                }

                if (!success && lastError) {
                    errors.push(`Error for ${asin}: ${lastError.message}`);
                }

                completed++;
            }

            // Export logic logic if we have results
            if (allDataList.length > 0 && runId) {
                // Prepare content and mimeType
                let content: any = undefined;
                let mimeType: string | undefined = undefined;

                if (outputFormat === 'json') {
                    content = JSON.stringify(allDataList, null, 2);
                    mimeType = 'application/json';
                } else if (outputFormat === 'xlsx' || outputFormat === 'excel') {
                    const excelResult = generateExcel(allDataList, 'Asin Data');
                    content = excelResult.content;
                    mimeType = excelResult.mimeType;
                } else {
                    // Manual CSV generation (keep existing logic if needed, but downloadService can also do it)
                    // If we pass 'data' to downloadService and format='csv', it does it automatically.
                    // But AsinX previously had custom CSV logic to handle nulls/formatting?
                    // Looking at previous code, it just handles quotes and joins. downloadService does this too.
                    // So we can simplify and just pass data for CSV.
                    // However, to be safe and strictly follow previous behavior of passed content:
                    if (allDataList.length === 0) content = "";
                    else {
                        const headers = Object.keys(allDataList[0]);
                        const csvRows = allDataList.map(row =>
                            headers.map(header => {
                                const val = row[header];
                                const escaped = String(val ?? '').replace(/"/g, '""');
                                return `"${escaped}"`;
                            }).join(',')
                        );
                        content = [headers.join(','), ...csvRows].join('\n');
                    }
                    mimeType = 'text/csv';
                }

                await downloadService.downloadTaskResults({
                    taskId: runId,
                    toolId: 'asin-x',
                    toolName: 'ASIN Explorer',
                    marketplace: marketplace.toUpperCase(),
                    data: allDataList,
                    source: 'quick_run',
                    format: (outputFormat === 'excel' ? 'xlsx' : outputFormat) as any,
                    preGeneratedContent: content,
                    mimeType: mimeType
                });
            }

            return {
                success: allDataList.length > 0,
                results: allDataList,
                creditsUsed: 0, // Should be calculated by caller? Or used 0? Logic says caller handles mostly but returns here for reference
                processedCount: completed,
                total: total,
                successful: successfulCount,
                failed: completed - successfulCount,
                errors: errors
            };

        } finally {
            if (runId) {
                this.activeRuns.delete(runId);
            }
        }
    }

    stop(runId: string) {
        this.activeRuns.set(runId, false);
    }
}

export const asinExplorerService = new AsinExplorerService();
