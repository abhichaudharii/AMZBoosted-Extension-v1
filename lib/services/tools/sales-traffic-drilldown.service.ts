import { ToolExecutionProgress } from '@/lib/types/tool-execution';
import { accountService } from '@/lib/services/account.service';

export interface SalesTrafficDrilldownOptions {
    marketplace: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    asinList?: string[]; // Optional parent/child ASINs (or empty for all)
    downloadType?: 'singleDateRange' | 'daily';
    runId?: string;
    delay?: number;
    slowMode?: boolean;
}

class SalesTrafficDrilldownService {
    private activeRuns = new Map<string, boolean>();

    /**
     * Stop a running task
     */
    stop(runId: string) {
        this.activeRuns.set(runId, false);
    }

    // ... methods ...

    /**
     * Get base domain for marketplace
     */
    private getBaseDomain(marketplace: string): string {
        // ... existing implementation ...
        const domains: Record<string, string> = {
            'US': 'sellercentral.amazon.com',
            'UK': 'sellercentral.amazon.com',
            'CA': 'sellercentral.amazon.com',
            'DE': 'sellercentral.amazon.de',
            'FR': 'sellercentral.amazon.fr',
            'IT': 'sellercentral.amazon.it',
            'ES': 'sellercentral.amazon.es',
            'IN': 'sellercentral.amazon.in',
            'JP': 'sellercentral.amazon.co.jp',
            'AU': 'sellercentral.amazon.com.au',
            'BR': 'sellercentral.amazon.com.br',
            'MX': 'sellercentral.amazon.com.mx',
            'NL': 'sellercentral.amazon.nl',
            'PL': 'sellercentral.amazon.pl',
            'SE': 'sellercentral.amazon.se',
            'BE': 'sellercentral.amazon.com.be',
        };
        return domains[marketplace.toUpperCase()] || 'sellercentral.amazon.com';
    }

    /**
     * Fetch child ASIN report for a date range
     */
    private async downloadChildASINReport(baseDomain: string, startDate: string, endDate: string, asins: string[] = [], _runId?: string | undefined, _p0?: (msg: any) => void) {
        // ... existing implementation ...
        const apiURL = `https://${baseDomain}/business-reports/api`;

        // Initialize the payload
        const payload: any = {
            operationName: "reportDataQuery",
            variables: {
                input: {
                    legacyReportId: "102:DetailSalesTrafficByChildItem",
                    startDate: startDate,
                    endDate: endDate,
                }
            },
            query: `query reportDataQuery($input: GetReportDataInput) {
                getReportData(input: $input) {
                    granularity
                    hadPrevious
                    hasNext
                    size
                    startDate
                    endDate
                    page
                    columns {
                        label
                        valueFormat
                        isGraphable
                        translationKey
                        isDefaultSortAscending
                        isDefaultGraphed
                        isDefaultSelected
                        isDefaultSortColumn
                        __typename
                    }
                    rows
                    __typename
                }
            }`
        };

        if (asins && asins.length > 0) {
            payload.variables.input.asins = asins;
        }

        try {
            // Fetch the first page
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed. Please log in to Seller Central.');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If we get HTML, it's likely a login page or error page
                const text = await response.text();
                if (text.includes('ap_signin_form') || text.includes('ap_email')) {
                    throw new Error('AUTH_FAILED: Session expired. Please log in to Seller Central.');
                }
                throw new Error('Invalid response format: Expected JSON but received ' + (contentType || 'unknown'));
            }

            let jsonData = await response.json();

            if (jsonData.errors) {
                throw new Error(jsonData.errors[0]?.message || 'Unknown error from Amazon API');
            }

            let reportData = jsonData.data?.getReportData;

            if (!reportData) {
                throw new Error('No report data returned');
            }

            console.log(`[SalesTraffic] Initial fetch complete. Rows: ${reportData.rows?.length}, HasNext: ${reportData.hasNext}`);

            // Initialize the response object to return
            const finalResponse = {
                columns: reportData.columns,
                rows: [...reportData.rows]
            };

            let pageCount = 0;
            const MAX_PAGES = 100; // Safety cap

            // Loop to fetch additional pages if they exist
            while (reportData.hasNext) {
                if (pageCount >= MAX_PAGES) {
                    console.warn('[SalesTraffic] Reached max page limit (safety break).');
                    break;
                }

                // Check active run status if possible (this service instance method would need access or passed token)
                // For now, relies on inner loop speed.

                pageCount++;
                payload.variables.input.page = pageCount;

                console.log(`[SalesTraffic] Fetching page ${pageCount + 1}...`);

                const nextResponse = await fetch(apiURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!nextResponse.ok) {
                    if (nextResponse.status === 401 || nextResponse.status === 403) {
                        throw new Error('AUTH_FAILED: Authentication failed.');
                    }
                    throw new Error(`HTTP error! Status: ${nextResponse.status}`);
                }

                const nextContentType = nextResponse.headers.get('content-type');
                if (!nextContentType || !nextContentType.includes('application/json')) {
                    throw new Error('AUTH_FAILED: Session expired during pagination.');
                }

                jsonData = await nextResponse.json();
                reportData = jsonData.data.getReportData;

                const newRows = reportData?.rows || [];
                console.log(`[SalesTraffic] Page ${pageCount + 1} fetched. Rows: ${newRows.length}, HasNext: ${reportData?.hasNext}`);

                // SAFETY CHECK: If hasNext is true but we got 0 rows, surely we are done or stuck.
                if (newRows.length === 0) {
                    console.warn('[SalesTraffic] Received 0 rows but hasNext is true. Breaking loop to prevent infinite requests.');
                    break;
                }

                // Append the new rows to the final response
                if (newRows.length > 0) {
                    finalResponse.rows.push(...newRows);
                }
            }

            return finalResponse;

        } catch (error) {
            console.error('An error occurred:', error);
            throw error;
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Execute the tool
     */
    async execute(
        _ignored: null,
        options: SalesTrafficDrilldownOptions,
        onProgress: (progress: ToolExecutionProgress) => void
    ): Promise<{
        results: any[];
        errors: string[];
        processedCount: number;
        successful: number;
        failed: number;
    }> {
        const { marketplace, startDate, endDate, runId, downloadType: _downloadType = 'singleDateRange', asinList = [] } = options;

        // Handle Account Switching if IDs are provided
        const globalAccountId = (options as any).globalAccountId;
        const marketplaceIds = (options as any).marketplaceIds;

        if (globalAccountId && marketplaceIds) {
            onProgress({
                total: 1,
                completed: 0,
                failed: 0,
                statusMessage: `Switching account to ${marketplace}...`
            });

            const merchantId = marketplaceIds.mons_sel_dir_mcid;
            const marketId = marketplaceIds.mons_sel_mkid;
            const partnerAccountId = globalAccountId;

            if (merchantId && marketId && partnerAccountId) {
                const switched = await accountService.switchAccount(merchantId, marketId, partnerAccountId);
                if (!switched) {
                    console.warn('Account switch verification failed. Proceeding with caution.');
                } else {
                    onProgress({
                        total: 1,
                        completed: 0,
                        failed: 0,
                        statusMessage: `Account switch successful.`
                    });
                    await this.sleep(2000);
                }
            }
        }

        const baseDomain = this.getBaseDomain(marketplace);

        if (runId) {
            this.activeRuns.set(runId, true);
        }

        const errors: string[] = [];
        let allRows: any[] = [];

        try {
            // ALWAYS use Single Date Range logic (Daily loop removed as per request)

            onProgress({
                total: 1,
                completed: 0,
                failed: 0,
                statusMessage: `Fetching report for ${startDate} to ${endDate}...`
            });

            if (runId && this.activeRuns.get(runId) === false) {
                return { results: [], errors: ['Stopped by user'], processedCount: 0, successful: 0, failed: 0 };
            }

            const data = await this.downloadChildASINReport(
                baseDomain,
                startDate,
                endDate,
                asinList,
                runId,
                (msg) => {
                    onProgress({
                        total: 1,
                        completed: 0,
                        failed: 0,
                        statusMessage: msg
                    });
                }
            );

            // Add date columns and convert to objects
            allRows = data.rows.map((row: any[]) => {
                const rowObj: any = {};
                data.columns.forEach((col: any, index: number) => {
                    rowObj[col.label] = row[index];
                });
                // When fetching a range, the API returns aggregated data for that range.
                // We mark it with start and end date.
                rowObj['startDate'] = startDate;
                rowObj['endDate'] = endDate;
                // rowObj['Date'] might exist if granularity allows, but usually for "Detailed Child ASIN" over a range, 
                // it is one summary row per ASIN.
                return rowObj;
            });

            onProgress({
                total: 1,
                completed: 1,
                failed: 0,
                statusMessage: `Completed. Found ${allRows.length} rows.`
            });

            return {
                results: allRows,
                errors,
                processedCount: allRows.length,
                successful: allRows.length,
                failed: errors.length
            };

        } catch (err: any) {
            const errorMessage = err.message || 'Unknown error';
            errors.push(errorMessage);

            return {
                results: [],
                errors,
                processedCount: 0,
                successful: 0,
                failed: 1
            };
        }
    }
}

export const salesTrafficDrilldownService = new SalesTrafficDrilldownService();
