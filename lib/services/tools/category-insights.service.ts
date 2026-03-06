import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

interface CategoryInsightsOptions {
    marketplace: string;
    keywords: string; // newline separated
    reportType: 'dly' | 'wly' | 'mly' | 'l7d' | 'l30d' | 'l90d' | 'l12m';
    runId?: string;
    delay?: number;
    outputFormat?: 'csv' | 'json' | 'excel' | 'xlsx';
    autoRetry?: boolean;
    slowMode?: boolean;
    smartScrape?: boolean;
}

interface CategoryInfo {
    categoryId: string;
    productTypeId: string;
    browseNodeId: string;
}

const marketplaceMap: Record<string, string> = {
    us: "ATVPDKIKX0DER",
    de: "A1PA6795UKMFR9",
    gb: "A1F83G8C2ARO7P",
    jp: "A1VC38T7YXB528",
    fr: "A13V1IB3VIYZZH",
    it: "APJ6JRA9NG5V4",
    es: "A1RKKUPIHCS9HS"
};

class CategoryInsightsService {
    private activeRuns = new Map<string, boolean>();



    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /*
    private generateFilename(prefix = '', suffix = '', market = '', taskType = '') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

        // User preferred format: CategoryInsight_US_L7D_2025-12-06_18-35-08_
        return `CategoryInsight_${market}_${taskType}_${formattedDate}_${suffix}.csv`
            .replace(/__+/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    */

    private async searchKeyword(keyword: string, regionCode: string): Promise<any> {
        const marketplaceId = marketplaceMap[regionCode.toLowerCase()];
        if (!marketplaceId) {
            console.error("❌ Invalid region code:", regionCode);
            return null;
        }

        const payload = {
            program: "sg_np_ar",
            searchTerm: keyword,
            producerId: "NEXT_SG_NP_AR_MODEL",
            marketplaceId
        };

        try {
            const response = await fetch("https://sellercentral.amazon.com/next/v2/searchSGAR", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "X-Requested-With": "XMLHttpRequest"
                },
                referrer: "https://sellercentral.amazon.com/selection/category-insights",
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('AUTH_FAILED: Session expired.');
            }

            return await response.json();
        } catch (error) {
            console.error("❌ searchKeyword error:", error);
            if (error instanceof Error && error.message.includes('AUTH_FAILED')) {
                throw error; // Re-throw critical auth errors
            }
            return null;
        }
    }

    private extractCategoryInfo(result: any): CategoryInfo {
        return {
            categoryId: result.categoryId,
            productTypeId: result.productTypeId,
            browseNodeId: result.browseNodeId
        };
    }

    private async getDashboardData(regionCode: string, categoryInfo: CategoryInfo): Promise<any> {
        const marketplaceId = marketplaceMap[regionCode.toLowerCase()];
        if (!marketplaceId) {
            console.error("❌ Invalid region code:", regionCode);
            return null;
        }

        const { categoryId, productTypeId, browseNodeId } = categoryInfo;

        const payload = {
            program: "sg_np_ar",
            targetMarketplaceId: marketplaceId,
            producerId: "NEXT_SG_NP_AR_MODEL",
            filter: {
                logicalOperator: "AND",
                filters: [
                    { key: "type", value: "MP_CAT_PTD_BN", conditionalOperator: "EQUALS" },
                    { key: "catId", value: categoryId, conditionalOperator: "EQUALS" },
                    { key: "ptdId", value: productTypeId, conditionalOperator: "EQUALS" },
                    { key: "bnId", value: browseNodeId, conditionalOperator: "EQUALS" }
                ]
            }
        };

        try {
            const response = await fetch("https://sellercentral.amazon.com/next/v2/getPerformanceDashboard", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    "X-Requested-With": "XMLHttpRequest"
                },
                referrer: "https://sellercentral.amazon.com/selection/category-insights",
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('AUTH_FAILED: Session expired.');
            }

            return await response.json();
        } catch (error) {
            console.error("❌ getDashboardData error:", error);
            if (error instanceof Error && error.message.includes('AUTH_FAILED')) {
                throw error; // Re-throw critical auth errors
            }
            return null;
        }
    }

    private async getDashboardForKeyword(keyword: string, region: string): Promise<any> {
        try {
            console.log(`[Lookup] 🔍 Searching keyword "${keyword}" in ${region}`);
            const result = await this.searchKeyword(keyword, region);

            if (!result || !result.length) {
                console.warn(`[Lookup] ⚠️ No result for "${keyword}"`);
                return null;
            }

            const categoryInfo = this.extractCategoryInfo(result[0]);
            console.log(`[Lookup] ✅ Category extracted`, categoryInfo);

            const dashboard = await this.getDashboardData(region, categoryInfo);
            if (!dashboard) {
                console.warn(`[Lookup] ❌ No dashboard data for keyword "${keyword}"`);
            }

            return dashboard;
        } catch (e) {
            console.error(`[Lookup] ❌ Failed dashboard lookup for "${keyword}"`, e);
            return null;
        }
    }

    private generateCSVContent(rows: any[][], reportType: string): string {
        if (!rows.length) return '';

        let headers: string[] = [];

        if (reportType === 'mly' || reportType === 'l12m') {
            headers = ['Keyword', 'Month', 'Year', 'Units Sold', 'Net Sales', 'Currency'];
        } else {
            headers = ['Keyword', 'Date', 'Units Sold', 'Net Sales', 'Currency'];
        }

        const sortedRows = [...rows].sort((a, b) => {
            if (reportType === 'mly' || reportType === 'l12m') {
                const monthMap: Record<string, number> = {
                    January: 0, February: 1, March: 2, April: 3,
                    May: 4, June: 5, July: 6, August: 7,
                    September: 8, October: 9, November: 10, December: 11
                };
                const yearA = parseInt(a[2]);
                const yearB = parseInt(b[2]);
                const monthA = monthMap[a[1]];
                const monthB = monthMap[b[1]];

                if (yearA !== yearB) return yearA - yearB;
                return monthA - monthB;
            } else {
                // Date format YYYY-MM-DD
                const dateA = new Date(a[1]);
                const dateB = new Date(b[1]);
                return dateA.getTime() - dateB.getTime();
            }
        });

        return [headers, ...sortedRows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    async execute(
        _urls: string[] | null,
        options: CategoryInsightsOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        // Marketplace can come from options (if set in UI) or might need to be passed from the scheduler's context
        // The scheduler passes 'marketplace' in the wrapper, but here we only see 'options'.
        // We should ensure 'marketplace' is in options when calling from scheduler.
        const { keywords, reportType, runId, delay = 2000, outputFormat = 'csv' } = options;

        // Fallback: If marketplace is missing in options, it might have been passed in the tool execution context
        // but this method signature only takes options. 
        // We need to ensure the caller (tool.service.ts) puts marketplace into options.
        // However, looking at the error `Invalid region code: undefined`, it's clear options.marketplace is undefined.
        // We will add a check and default or error out gracefully.
        // Ensure marketplace is present
        const marketplace = options.marketplace;

        if (!marketplace) {
            console.error("[CategoryInsights] Marketplace is missing in options");
            // If calling from tool service context, marketplace might be in a different place?
            // But strict typing says it should be in options.
            // Returning error object that matches expected 'any' but implies failure structure
            return {
                success: false,
                results: [],
                errors: ["Marketplace is missing. Please check your schedule settings or selected tool options."],
                total: 0,
                processedCount: 0,
                successful: 0,
                failed: 0
            };
        }

        let keywordList: string[] = [];
        // Handle case where keywords is a single string (split by comma or wrap)
        if (typeof keywords === 'string') {
            // Use helper method to split by newline/comma consistently?
            // Or just stick to current logic but fix type
            if (keywords.includes(',')) {
                keywordList = keywords.split(',').map(k => k.trim());
            } else if (keywords.includes('\n')) {
                keywordList = keywords.split('\n').map(k => k.trim());
            } else {
                keywordList = [keywords];
            }
        } else if (Array.isArray(keywords)) {
            keywordList = keywords;
        }

        const total = keywordList.length;
        let completed = 0;
        let successfulCount = 0;
        const csvRows: any[][] = [];
        const jsonData: any[] = [];

        if (runId) {
            this.activeRuns.set(runId, true);
        }

        console.log(`[CategoryInsights] Starting ${reportType} task for ${total} keywords. Delay: ${delay}ms, Format: ${outputFormat}`);

        try {
            for (const keyword of keywordList) {
                if (runId && !this.activeRuns.get(runId)) break;

                // Validate Input: Check if it looks like an ASIN (starts with B0, 10 chars) 
                // Category Insights requires keywords, not ASINs.
                // Regex for ASIN: starts with B, 10 alphanumeric chars.
                const asinRegex = /^[A-Z0-9]{10}$/;
                if (asinRegex.test(keyword) && keyword.startsWith('B')) {
                    const errorMsg = `Invalid input: "${keyword}" looks like an ASIN. Category Insights requires Search Terms/Keywords.`;
                    console.warn(`[CategoryInsights] ${errorMsg}`);
                    onProgress({
                        total,
                        completed,
                        currentUrl: keyword,
                        statusMessage: 'Skipped: Input is an ASIN (Keywords required)'
                    });
                    // errors.push(errorMsg); // Should we add to errors? Yes, but current logic treats empty result as failure anyway.
                    // Just skip to next
                    completed++;
                    continue;
                }

                // 1. Delay Phase
                const isFirst = keywordList.indexOf(keyword) === 0;
                let effectiveDelay = delay;

                if (options.slowMode) {
                    const base = Math.max(delay, 2000);
                    effectiveDelay = base + Math.random() * 2000;
                }

                if (!isFirst && effectiveDelay > 0) {
                    onProgress({
                        total,
                        completed,
                        currentUrl: keyword,
                        statusMessage: `Waiting ${Math.round(effectiveDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                    });
                    await this.delay(effectiveDelay);
                }

                if (runId && !this.activeRuns.get(runId)) break;

                // 2. Processing Phase with Retry
                const maxRetries = options.autoRetry ? 3 : 1;
                let attempt = 0;
                let success = false;

                while (attempt < maxRetries && !success) {
                    if (runId && !this.activeRuns.get(runId)) break;
                    attempt++;

                    onProgress({
                        total,
                        completed,
                        currentUrl: keyword,
                        statusMessage: attempt > 1 ? `Processing "${keyword}" (Attempt ${attempt}/${maxRetries} - Smart Scrape)...` : `Processing "${keyword}"...`
                    });

                    let keywordHasData = false;

                    try {
                        const dashboardData = await this.getDashboardForKeyword(keyword, marketplace);

                        if (dashboardData) {
                            const unitsNode = dashboardData?.demand?.unitSold?.[reportType];
                            const salesNode = dashboardData?.demand?.netShippedGMS?.[reportType];

                            const unitsList = unitsNode?.graphDataPointsList || [];
                            const salesList = salesNode?.graphDataPointsList || [];
                            const salesMap = Object.fromEntries(salesList.map((p: any) => [p.label, p.value]));

                            if (unitsList.length > 0) {
                                keywordHasData = true;
                                success = true; // Found data, success
                            }

                            const currencyCode = dashboardData.currencyCode || '';

                            for (const point of unitsList) {
                                let row: any[] = [];
                                let jsonItem: any = {
                                    keyword,
                                    unitsSold: point.value,
                                    netSales: salesMap[point.label] ?? 0,
                                    currency: currencyCode
                                };

                                if (reportType === 'mly' || reportType === 'l12m') {
                                    const [yearStr, monthStr] = point.label.split('-');
                                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                                        'August', 'September', 'October', 'November', 'December'];
                                    const monthName = monthNames[parseInt(monthStr) - 1];

                                    row = [
                                        keyword,
                                        monthName,
                                        yearStr,
                                        point.value,
                                        salesMap[point.label] ?? 0,
                                        currencyCode
                                    ];

                                    jsonItem.month = monthName;
                                    jsonItem.year = yearStr;
                                } else {
                                    row = [
                                        keyword,
                                        point.label,
                                        point.value,
                                        salesMap[point.label] ?? 0,
                                        currencyCode
                                    ];

                                    jsonItem.date = point.label;
                                }

                                csvRows.push(row);
                                jsonData.push(jsonItem);
                            }
                        } else {
                            // Null returned -> likely error caught inside helper or no result
                            // Since helper catches error, we can't distinguish easy.
                            // But if null, we treat as failed attempt IF we want to retry?
                            // Current helper logs errors. 
                            // We'll treat as 'Success' (Empty) to avoid infinite retry loop on bad keywords.
                            success = true;
                        }
                    } catch (err: any) {
                        console.error(`❌ Error for keyword "${keyword}" (Attempt ${attempt}):`, err);

                        if (err.message && (err.message.includes('AUTH_FAILED') || err.message.includes('Session expired'))) {
                            onProgress({
                                total,
                                completed,
                                currentUrl: keyword,
                                failed: total - successfulCount, // Assume rest failed
                                statusMessage: `Stopped due to Auth Failure: ${err.message}`
                            });
                            if (runId) this.activeRuns.set(runId, false);
                            break; // Break Retry Loop
                        }

                        if (options.smartScrape && attempt < maxRetries) {
                            const backoff = 2000 * Math.pow(2, attempt);
                            onProgress({
                                total,
                                completed,
                                currentUrl: keyword,
                                statusMessage: `Smart Scrape Error. Retrying in ${backoff / 1000}s...`
                            });
                            await this.delay(backoff);
                        } else {
                            // If no smart scrape or last attempt, fail
                        }
                    }

                    if (keywordHasData) {
                        successfulCount = successfulCount; // Logic below increments it? 
                        // Wait, previous code incremented successfulCount if keywordHasData.
                        // We should track this.
                    }
                    if (success && keywordHasData) successfulCount++;

                } // End Retry Loop

                completed++;
            }

            if (csvRows.length && runId) {
                // ... (download logic remains same)
                let content: any = undefined;
                let mimeType: string | undefined = undefined;

                if (outputFormat === 'json') {
                    content = JSON.stringify(jsonData, null, 2);
                    mimeType = 'application/json';
                } else if (outputFormat === 'xlsx' || outputFormat === 'excel') {
                    // Flatten data for Excel if needed, or use csvRows (which are arrays)
                    // generateExcel expects array of objects for better column handling, OR array of arrays?
                    // json_to_sheet works best with objects.
                    // csvRows is [][] array. jsonData is [] object array.
                    // Better to use jsonData for Excel!
                    const excelResult = generateExcel(jsonData, 'Category Data');
                    content = excelResult.content;
                    mimeType = excelResult.mimeType;
                } else {
                    content = this.generateCSVContent(csvRows, reportType);
                    mimeType = 'text/csv';
                }

                await downloadService.downloadTaskResults({
                    taskId: runId,
                    toolId: 'category-insights',
                    toolName: 'Category Insights',
                    marketplace: marketplace.toUpperCase(),
                    data: jsonData, // Pass object data for record count and potential fallback
                    source: 'quick_run',
                    format: (outputFormat === 'excel' ? 'xlsx' : outputFormat) as any,
                    preGeneratedContent: content,
                    mimeType: mimeType
                });
            }

            return {
                success: csvRows.length > 0,
                results: csvRows,
                creditsUsed: 0,
                processedCount: completed,
                total: total,
                successful: successfulCount,
                failed: completed - successfulCount,
                errors: csvRows.length === 0 ? ['No data found for the provided keywords'] : []
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

export const categoryInsightsService = new CategoryInsightsService();
