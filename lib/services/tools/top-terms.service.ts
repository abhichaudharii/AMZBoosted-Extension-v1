import { ToolExecutionProgress } from '@/lib/types/tool-execution';

export interface TopTermsOptions {
    marketplace: string;
    asins: string[];
    searchTerms: string[];
    weeks: string[];
    downloadType: 'oneCSV' | 'separateCSV';
    runId?: string;
    delay?: number;
    autoRetry?: boolean;
    slowMode?: boolean;
    smartScrape?: boolean;
}

class TopTermsService {
    private activeRuns = new Map<string, boolean>();

    /**
     * Helper to subtract days from date
     */
    private subtractDaysFromDate(dateString: string, days: number): string {
        const [year, month, day] = dateString.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        date.setDate(date.getDate() - days);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    private getBaseDomain(marketplace: string): string {
        const domains: Record<string, string> = {
            'US': 'sellercentral.amazon.com',
            'UK': 'sellercentral.amazon.co.uk',
            'CA': 'sellercentral.amazon.ca',
            'DE': 'sellercentral.amazon.de',
            'FR': 'sellercentral.amazon.fr',
            'IT': 'sellercentral.amazon.it',
            'ES': 'sellercentral.amazon.es',
            'IN': 'sellercentral.amazon.in',
            'JP': 'sellercentral.amazon.co.jp',
            'AU': 'sellercentral.amazon.com.au',
            'MX': 'sellercentral.amazon.com.mx',
            'BR': 'sellercentral.amazon.com.br',
            'TR': 'sellercentral.amazon.com.tr',
            'AE': 'sellercentral.amazon.ae',
            'SA': 'sellercentral.amazon.sa',
            'NL': 'sellercentral.amazon.nl',
            'SE': 'sellercentral.amazon.se',
            'PL': 'sellercentral.amazon.pl',
            'BE': 'sellercentral.amazon.com.be',
        };
        return domains[marketplace] || 'sellercentral.amazon.com';
    }

    private async fetchDataForPage(
        asin: string,
        searchTerm: string,
        week: string,
        pageNumber: number,
        marketplace: string,
        baseDomain: string
    ) {
        const filterSelections: any[] = [
            { id: "reporting-range", value: "weekly", valueType: null },
            { id: "weekly-week", value: week, valueType: "weekly" }
        ];

        if (asin && asin.trim() !== "" && asin.trim().toLowerCase() !== "none") {
            filterSelections.push({
                id: "asins",
                value: asin.trim(),
                valueType: "ASIN"
            });
        }

        if (searchTerm && searchTerm.trim() !== "" && searchTerm.trim().toLowerCase() !== "none") {
            filterSelections.push({ id: "search-term-freeform", value: searchTerm.trim(), valueType: "SEARCH_TERM" });
        }

        const postData = {
            viewId: "top-search-terms-default-view",
            filterSelections: filterSelections,
            reportOperations: [
                {
                    reportId: "top-search-terms-report-table",
                    reportType: "TABLE",
                    pageNumber: pageNumber,
                    pageSize: 100,
                    sortByColumnId: "st-search-frequency",
                    ascending: true
                }
            ],
            selectedCountries: [marketplace.toLowerCase()],
            reportId: "top-search-terms-report-table"
        };

        const response = await fetch(`https://${baseDomain}/api/brand-analytics/v1/dashboard/top-search-terms/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication failed. Please log in to Seller Central.');
            }
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Check for HTML response (login page redirect)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (text.includes('<!doctype html>') || text.includes('<html') || text.includes('ap_signin_form')) {
                throw new Error('AUTH_FAILED: Session expired or not logged in.');
            }
            throw new Error(`Invalid response format: Expected JSON but received ${contentType}`);
        }

        return await response.json();
    }

    async getWeeks(marketplace: string): Promise<{ label: string; value: string }[]> {
        const baseDomain = this.getBaseDomain(marketplace);
        const url = `https://${baseDomain}/api/brand-analytics/v1/dashboard/top-search-terms/metadata`;

        const postData = {
            selectedCountries: [marketplace.toLowerCase()]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('AUTH_FAILED: Authentication failed.');
                }
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('AUTH_FAILED: Session expired.');
            }

            const data = await response.json();

            const weeks: { label: string; value: string }[] = [];
            const views = data?.metadata?.viewsRoot?.views;
            if (views) {
                const reportingRangeFilter = views.find((view: any) => view.id === "top-search-terms-default-view");
                if (reportingRangeFilter) {
                    const weekFilter = reportingRangeFilter?.filters.find((filter: any) => filter.id === "reporting-range");
                    if (weekFilter) {
                        const weekValues = weekFilter?.values;
                        if (weekValues) {
                            weekValues.forEach((value: any) => {
                                if (value.child?.type === "DROPDOWN") {
                                    const options = value.child?.values;
                                    options.forEach((option: any) => {
                                        weeks.push({
                                            label: option.localizedDisplayValue,
                                            value: option.value
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            }
            return weeks;

        } catch (error) {
            console.error('[Top Terms Service] Failed to fetch weeks:', error);
            throw error;
        }
    }

    async execute(
        _tabId: number | null, // Deprecated but kept for signature compatibility if needed, or we can remove
        options: TopTermsOptions,
        onProgress: (progress: ToolExecutionProgress) => void
    ): Promise<{
        total: number;
        successful: number;
        failed: number;
        startTime: number; results: any[]
    }> {
        console.log('[Top Terms Service] Starting execution', options);
        const { marketplace, asins, searchTerms, weeks, runId } = options;
        const baseDomain = this.getBaseDomain(marketplace);

        if (runId) {
            this.activeRuns.set(runId, true);
        }

        const allRowsData: any[] = [];

        // Normalize inputs
        const asinList = (!asins || asins.length === 0) ? ['none'] : asins;
        const termList = (!searchTerms || searchTerms.length === 0) ? ['none'] : searchTerms;

        const totalOperations = asinList.length * termList.length * weeks.length;
        let completedOperations = 0;
        let failedOperations = 0;

        try {
            for (const asin of asinList) {
                if (runId && !this.activeRuns.get(runId)) break;

                for (const searchTerm of termList) {
                    if (runId && !this.activeRuns.get(runId)) break;

                    for (const week of weeks) {
                        if (runId && !this.activeRuns.get(runId)) break;

                        try {
                            // ... (existing logic)
                            // Construct display label
                            let label = '';
                            if (searchTerm !== 'none') {
                                label = `Term: ${searchTerm}`;
                            } else if (asin !== 'none') {
                                label = `ASIN: ${asin}`;
                            } else {
                                label = 'Top Terms';
                            }

                            // Report progress
                            onProgress({
                                total: totalOperations,
                                completed: completedOperations,
                                currentUrl: asin !== 'none' ? asin : (searchTerm !== 'none' ? searchTerm : 'Top Terms'),
                                failed: failedOperations,
                                statusMessage: `Processing ${label} - Week ${week}`
                            });

                            // Recursive pagination handling
                            let page = 1;
                            let hasMorePages = true;

                            while (hasMorePages) {
                                if (runId && !this.activeRuns.get(runId)) break;

                                // Delay with Slow Mode
                                let effectiveDelay = options.delay || 500;
                                if (options.slowMode) {
                                    effectiveDelay = Math.max(effectiveDelay, 2000) + Math.random() * 2000;
                                }

                                if (effectiveDelay > 0) {
                                    onProgress({
                                        total: totalOperations,
                                        completed: completedOperations,
                                        currentUrl: asin !== 'none' ? asin : (searchTerm !== 'none' ? searchTerm : 'Top Terms'),
                                        failed: failedOperations,
                                        statusMessage: `Waiting ${Math.round(effectiveDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                                    });
                                    await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                                }

                                // Fetch with Retry
                                const maxRetries = options.autoRetry ? 3 : 1;
                                let attempt = 0;
                                let success = false;
                                let data: any = null;

                                while (attempt < maxRetries && !success) {
                                    attempt++;
                                    if (attempt > 1) {
                                        onProgress({
                                            total: totalOperations,
                                            completed: completedOperations,
                                            currentUrl: asin !== 'none' ? asin : (searchTerm !== 'none' ? searchTerm : 'Top Terms'),
                                            failed: failedOperations,
                                            statusMessage: `Fetching Page ${page} (Attempt ${attempt}/${maxRetries})...`
                                        });
                                    }

                                    try {
                                        data = await this.fetchDataForPage(asin, searchTerm, week, page, marketplace, baseDomain);
                                        success = true;
                                    } catch (e: any) {
                                        console.error(`Error processing page ${page} (Attempt ${attempt}):`, e);
                                        if (options.smartScrape && attempt < maxRetries) {
                                            const backoff = 2000 * Math.pow(2, attempt);
                                            onProgress({
                                                total: totalOperations,
                                                completed: completedOperations,
                                                currentUrl: asin !== 'none' ? asin : (searchTerm !== 'none' ? searchTerm : 'Top Terms'),
                                                failed: failedOperations,
                                                statusMessage: `Smart Scrape Error: ${e.message}. Retrying in ${backoff / 1000}s...`
                                            });
                                            await new Promise(resolve => setTimeout(resolve, backoff));
                                        } else {
                                            // If fail and final attempt, we might break outer loop? or just let it fail naturally in processing
                                            throw e; // Propagate to outer catch
                                        }
                                    }
                                }
                                // OLD DUPLICATE REMOVED


                                // Use 'data' from retry loop
                                if (!data) {
                                    // If no data after retries, skip processing rows
                                } else {

                                    // Modify each row
                                    if (data.reportsV2) {
                                        data.reportsV2.forEach((report: any) => {
                                            report.rows.forEach((row: any) => {
                                                row.ASIN = asin;
                                                row.SearchedTerm = searchTerm;
                                                row.Week = this.subtractDaysFromDate(week, -1);
                                            });
                                        });
                                    }

                                    const pageRows = data.reportsV2 ? data.reportsV2.flatMap((report: any) => report.rows) : [];

                                    if (pageRows.length > 0) {
                                        allRowsData.push(...pageRows);
                                    }

                                    // Check pagination
                                    hasMorePages = false;
                                    if (data.reportsV2) {
                                        data.reportsV2.forEach((report: any) => {
                                            if (report.totalItems > page * 100) {
                                                hasMorePages = true;
                                            }
                                        });
                                    }

                                    if (hasMorePages) {
                                        page++;
                                    }
                                } // End else
                            } // End while(hasMorePages)
                        } catch (error: any) {
                            console.error(`Error processing ${asin}/${searchTerm}/${week}:`, error);
                            failedOperations++;

                            if (error.message && (error.message.includes('AUTH_FAILED') || error.message.includes('Session expired'))) {
                                // Break all loops
                                onProgress({
                                    total: totalOperations,
                                    completed: completedOperations,
                                    currentUrl: 'Stopping...',
                                    failed: failedOperations,
                                    statusMessage: `Stopped due to Auth Failure: ${error.message}`
                                });
                                if (runId) this.activeRuns.set(runId, false);
                                break;
                            }
                        }

                        completedOperations++;
                    }
                }
            }

            return {
                results: allRowsData,
                total: totalOperations,
                successful: completedOperations - failedOperations,
                failed: failedOperations,
                startTime: Date.now() // Estimate
            };

        } finally {
            if (runId) {
                this.activeRuns.delete(runId);
            }
        }
    }

    stop(runId: string): void {
        this.activeRuns.set(runId, false);
    }
}

export const topTermsService = new TopTermsService();
