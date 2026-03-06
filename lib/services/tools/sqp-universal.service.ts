import { ToolExecutionProgress } from '@/lib/types/tool-execution';

export interface SQPSnapshotOptions {
    marketplace: string;
    asins: string[];
    weeks: string[];
    downloadType: 'oneCSV' | 'separateCSV';
    pageSize?: number;
    delay?: number;
    autoRetry?: boolean;
    slowMode?: boolean;
    smartScrape?: boolean;
}

class SQPUniversalService {
    private activeRuns = new Map<string, boolean>(); // runId -> isRunning
    private runStates = new Map<string, {
        toolId: string;
        startTime: number;
        progress: ToolExecutionProgress;
        status: 'running' | 'paused' | 'completed' | 'failed';
    }>();

    /**
     * Get active run state for a tool
     */
    getActiveRun(toolId: string): { runId: string; toolId: string; startTime: number; progress: ToolExecutionProgress; status: string } | null {
        for (const [runId, state] of this.runStates.entries()) {
            if (state.toolId === toolId && state.status === 'running') {
                return {
                    runId,
                    ...state
                };
            }
        }
        return null;
    }

    /**
     * Helper to subtract days from date
     */
    private subtractDaysFromDate(dateString: string, days: number): string {
        const [year, month, day] = dateString.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        date.setDate(date.getDate() - days);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Get base domain for marketplace
     */
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
        };
        return domains[marketplace.toUpperCase()] || 'sellercentral.amazon.com';
    }

    /**
     * Fetch data for a specific page
     */
    private async fetchDataForPage(
        asin: string,
        week: string,
        pageNumber: number,
        marketplace: string,
        baseDomain: string,
        pageSize: number = 25
    ) {
        const postData = {
            viewId: "query-performance-asin-view",
            filterSelections: [
                { id: "asin", value: asin.trim(), valueType: "ASIN" },
                { id: "reporting-range", value: "weekly", valueType: null },
                { id: "weekly-week", value: week, valueType: "weekly" }
            ],
            reportOperations: [
                {
                    reportId: "query-performance-asin-report-table",
                    reportType: "TABLE",
                    pageNumber: pageNumber,
                    pageSize: pageSize,
                    sortByColumnId: "qp-asin-query-rank",
                    ascending: true
                }
            ],
            selectedCountries: [marketplace.toLowerCase()],
            reportId: "query-performance-asin-report-table"
        };

        const response = await fetch(`https://${baseDomain}/api/brand-analytics/v1/dashboard/query-performance/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Important: These headers might be needed to avoid 403/401
                // 'Origin': `https://${baseDomain}`,
                // 'Referer': `https://${baseDomain}/brand-analytics/dashboard/query-performance`
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication failed. Please log in to Seller Central.');
            }
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Check for JSON content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // If we got HTML (likely a login page redirect), throw Auth error
            const text = await response.text();
            if (text.includes('<!doctype html>') || text.includes('<html') || text.includes('ap_signin_form')) {
                throw new Error('AUTH_FAILED: Session expired. Please log in to Seller Central.');
            }
            throw new Error(`Invalid response format: Expected JSON but received ${contentType}`);
        }

        try {
            const text = await response.text();
            return JSON.parse(text);
        } catch (e) {
            throw new Error('AUTH_FAILED: Failed to parse Amazon response. You may need to log in again.');
        }
    }

    /**
     * Fetch available weeks
     */
    async fetchWeeks(marketplace: string): Promise<{ label: string; value: string }[]> {
        const baseDomain = this.getBaseDomain(marketplace);
        const postData = {
            selectedCountries: [marketplace.toLowerCase()]
        };

        try {
            const response = await fetch(`https://${baseDomain}/api/brand-analytics/v1/dashboard/query-performance/metadata`, {
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

            // Extract weeks
            const views = data?.metadata?.viewsRoot?.views;
            if (views) {
                const reportingRangeFilter = views.find((view: any) => view.id === "query-performance-brands-view");
                if (reportingRangeFilter) {
                    const weekFilter = reportingRangeFilter?.filters.find((filter: any) => filter.id === "reporting-range");
                    if (weekFilter) {
                        const weekValues = weekFilter?.values[0]?.child?.values;
                        if (weekValues) {
                            return weekValues.map((value: any) => ({
                                label: value.localizedDisplayValue,
                                value: value.value
                            }));
                        }
                    }
                }
            }
            return [];
        } catch (error) {
            console.error('[SQP Universal] Failed to fetch weeks:', error);
            throw error;
        }
    }

    /**
     * Execute SQP Snapshot
     */
    async executeSnapshot(
        options: SQPSnapshotOptions & { runId?: string },
        onProgress: (progress: ToolExecutionProgress) => void
    ): Promise<{
        total: number;
        successful: number;
        failed: number;
        startTime: number; results: any[], errors: string[], processedCount: number
    }> {
        const { marketplace, runId } = options;
        const asins = options.asins || [];
        let weeks = options.weeks || [];
        const baseDomain = this.getBaseDomain(marketplace);
        const allRowsData: any[] = [];
        const errors: string[] = [];
        let completed = 0;

        // Auto-select latest week if none provided
        if (weeks.length === 0) {
            try {
                console.log('[SQP Universal] No weeks provided, fetching latest week...');
                const availableWeeks = await this.fetchWeeks(marketplace);
                if (availableWeeks && availableWeeks.length > 0) {
                    // Sort by value descending (assuming YYYY-Www format) just in case, 
                    // though usually API returns sorted.
                    // Actually, let's just take the first one as it's typically the latest in the dropdown list logic
                    // But to be safe, let's look at the values.
                    // The values are like "2023-W40".
                    // Let's pick the one with the highest value.
                    const latestWeek = availableWeeks.sort((a, b) => b.value.localeCompare(a.value))[0];
                    weeks = [latestWeek.value];
                    console.log(`[SQP Universal] Auto-selected latest week: ${latestWeek.value} (${latestWeek.label})`);
                } else {
                    console.warn('[SQP Universal] Failed to fetch weeks or no weeks available');
                }
            } catch (err: any) {
                console.error('[SQP Universal] Error fetching weeks for auto-selection:', err);
                errors.push(`Failed to fetch available weeks: ${err.message}`);
                if (err.message && err.message.includes('AUTH_FAILED')) {
                    return { results: [], errors: [err.message], processedCount: 0, total: 0, successful: 0, failed: 1, startTime: Date.now() };
                }
            }
        }

        if (weeks.length === 0) {
            const msg = 'No weeks selected and failed to auto-fetch latest week. Please ensure you are logged into Seller Central.';
            console.error(`[SQP Universal] ${msg}`);
            errors.push(msg);
            return {
                results: [],
                errors,
                processedCount: 0,
                total: 0,
                successful: 0,
                failed: errors.length,
                startTime: Date.now()
            };
        }

        const total = asins.length * weeks.length;
        const pageSize = options.pageSize || 25;

        if (runId) {
            this.activeRuns.set(runId, true);
            this.runStates.set(runId, {
                toolId: 'sqr-simple',
                startTime: Date.now(),
                progress: { total, completed: 0, failed: 0, currentUrl: 'Initializing...' },
                status: 'running'
            });
        }

        console.log('[SQP Universal] Starting Snapshot', { asins, weeks, marketplace, baseDomain });

        try {
            mainLoop:
            for (const asin of asins) {
                if (runId && !this.activeRuns.get(runId)) break;

                for (const week of weeks) {
                    if (runId && !this.activeRuns.get(runId)) break;

                    try {
                        const progress = {
                            total,
                            completed,
                            failed: errors.length,
                            currentUrl: asin, // Use ASIN to match job ID
                            statusMessage: `Processing Snapshot - Week ${week}`
                        };

                        if (runId) {
                            const state = this.runStates.get(runId);
                            if (state) {
                                state.progress = progress;
                                this.runStates.set(runId, state);
                            }
                        }

                        onProgress(progress);

                        // 1. Fetch Page 1 to get total items
                        const page1Data = await this.fetchDataForPage(asin, week, 1, marketplace, baseDomain, pageSize);

                        // Process Page 1
                        let totalItems = 0;
                        if (page1Data.reportsV2) {
                            page1Data.reportsV2.forEach((report: any) => {
                                totalItems = Math.max(totalItems, report.totalItems);
                                report.rows.forEach((row: any) => {
                                    row.ASIN = asin;
                                    row.Week = this.subtractDaysFromDate(week, -1);
                                });
                            });
                            const rows = page1Data.reportsV2.flatMap((report: any) => report.rows);
                            allRowsData.push(...rows);
                        }

                        // 2. Calculate remaining pages
                        const totalPages = Math.ceil(totalItems / pageSize);

                        // 3. Fetch remaining pages
                        // 3. Fetch remaining pages
                        for (let page = 2; page <= totalPages; page++) {
                            if (runId && !this.activeRuns.get(runId)) break;

                            // Add delay with Slow Mode
                            let effectiveDelay = options.delay || 1000;
                            if (options.slowMode) {
                                effectiveDelay = Math.max(effectiveDelay, 2000) + Math.random() * 2000;
                            }

                            if (effectiveDelay > 0) {
                                onProgress({
                                    ...progress, // reuse current progress state
                                    statusMessage: `Waiting ${Math.round(effectiveDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                                });
                                await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                            }

                            // Retry Loop
                            const maxRetries = options.autoRetry ? 3 : 1;
                            let attempt = 0;
                            let success = false;

                            while (attempt < maxRetries && !success) {
                                attempt++;
                                // Update status for retries
                                if (attempt > 1) {
                                    onProgress({
                                        ...progress,
                                        statusMessage: `Fetching Page ${page} (Attempt ${attempt}/${maxRetries})...`
                                    });
                                }

                                try {
                                    const pageData = await this.fetchDataForPage(asin, week, page, marketplace, baseDomain, pageSize);

                                    if (pageData.reportsV2) {
                                        pageData.reportsV2.forEach((report: any) => {
                                            report.rows.forEach((row: any) => {
                                                row.ASIN = asin;
                                                row.Week = this.subtractDaysFromDate(week, -1);
                                            });
                                        });
                                        const rows = pageData.reportsV2.flatMap((report: any) => report.rows);
                                        allRowsData.push(...rows);
                                        success = true;
                                    } else {
                                        success = true;
                                    }
                                } catch (e: any) {
                                    console.error(`Error processing page ${page} (Attempt ${attempt}):`, e);
                                    if (options.smartScrape && attempt < maxRetries) {
                                        const backoff = 2000 * Math.pow(2, attempt);
                                        onProgress({
                                            ...progress,
                                            statusMessage: `Smart Scrape Error: ${e.message}. Retrying in ${backoff / 1000}s...`
                                        });
                                        await new Promise(resolve => setTimeout(resolve, backoff));
                                    }
                                }
                            }
                        }

                        completed++;
                    } catch (error: any) {
                        console.error(`[SQP Universal] Error processing ${asin} - ${week}:`, error);
                        errors.push(`${asin} (${week}): ${error instanceof Error ? error.message : String(error)}`);
                        completed++;

                        if (error.message && (error.message.includes('AUTH_FAILED') || error.message.includes('Session expired'))) {
                            onProgress({
                                total,
                                completed,
                                failed: errors.length,
                                statusMessage: `Stopped due to Auth Failure: ${error.message}`
                            });
                            if (runId) this.activeRuns.set(runId, false);
                            break mainLoop;
                        }
                    }
                }
                // Delay between ASINs
                // Delay between ASINs
                const asinDelay = options.slowMode ? (Math.max(options.delay || 1000, 3000) + Math.random() * 2000) : (options.delay || 1000);
                onProgress({
                    total,
                    completed,
                    failed: errors.length,
                    currentUrl: asins[completed + 1] || asin, // Show next ASIN if valid
                    statusMessage: `Waiting ${Math.round(asinDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                });
                await new Promise(resolve => setTimeout(resolve, asinDelay));
            }

            return {
                results: allRowsData,
                errors,
                processedCount: completed,
                total: total,
                successful: completed - errors.length,
                failed: errors.length,
                startTime: Date.now()
            };
        } finally {
            if (runId) {
                this.activeRuns.delete(runId);
                this.runStates.delete(runId);
            }
        }
    }

    /**
     * Fetch details for a specific query (Deep Dive)
     */
    private async fetchQueryDetails(asin: string, week: string, marketplace: string, query: string, baseDomain: string) {
        const postData = {
            viewId: 'query-detail-asin-view',
            filterSelections: [
                { id: 'asin', value: asin, valueType: 'ASIN' },
                { id: 'search-term-freeform', value: query, valueType: 'SEARCH_TERM' },
                { id: 'reporting-range', value: 'weekly', valueType: null },
                { id: 'weekly-week', value: week, valueType: 'weekly' }
            ],
            selectedCountries: [marketplace.toLowerCase()]
        };

        const response = await fetch(`https://${baseDomain}/api/brand-analytics/v1/dashboard/query-detail/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch query details: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Execute SQP Deep Dive
     */
    async executeDeepDive(
        options: SQPSnapshotOptions & { runId?: string },
        onProgress: (progress: ToolExecutionProgress) => void
    ): Promise<{
        total: number;
        successful: number;
        failed: number;
        startTime: number; results: any[], errors: string[], processedCount: number
    }> {
        const { marketplace, runId } = options;
        const asins = options.asins || [];
        let weeks = options.weeks || [];
        const baseDomain = this.getBaseDomain(marketplace);
        const allRowsData: any[] = [];
        const errors: string[] = [];
        let completed = 0;

        // Auto-select latest week if none provided
        if (weeks.length === 0) {
            try {
                console.log('[SQP Universal] No weeks provided (Deep Dive), fetching latest week...');
                const availableWeeks = await this.fetchWeeks(marketplace);
                if (availableWeeks && availableWeeks.length > 0) {
                    const latestWeek = availableWeeks.sort((a, b) => b.value.localeCompare(a.value))[0];
                    weeks = [latestWeek.value];
                    console.log(`[SQP Universal] Auto-selected latest week: ${latestWeek.value} (${latestWeek.label})`);
                } else {
                    console.warn('[SQP Universal] Failed to fetch weeks or no weeks available');
                }
            } catch (err) {
                console.error('[SQP Universal] Error fetching weeks for auto-selection:', err);
            }
        }

        const total = asins.length * weeks.length;
        const pageSize = 25; // Fixed page size for fetching queries list

        if (runId) {
            this.activeRuns.set(runId, true);
            this.runStates.set(runId, {
                toolId: 'sqr-detail',
                startTime: Date.now(),
                progress: { total, completed: 0, failed: 0, currentUrl: 'Initializing...' },
                status: 'running'
            });
        }

        console.log('[SQP Universal] Starting Deep Dive', { asins, weeks, marketplace, baseDomain });

        try {
            mainLoop:
            for (const asin of asins) {
                if (runId && !this.activeRuns.get(runId)) break;

                for (const week of weeks) {
                    if (runId && !this.activeRuns.get(runId)) break;

                    try {
                        const progress = {
                            total,
                            completed,
                            failed: errors.length,
                            currentUrl: asin, // Use ASIN to match job ID
                            statusMessage: `Processing Deep Dive - Week ${week}`
                        };

                        if (runId) {
                            const state = this.runStates.get(runId);
                            if (state) {
                                state.progress = progress;
                                this.runStates.set(runId, state);
                            }
                        }

                        onProgress(progress);

                        // 1. Fetch all queries for this ASIN & Week (using pagination)
                        let page = 1;
                        let hasMorePages = true;
                        const queries: string[] = [];

                        while (hasMorePages) {
                            if (runId && !this.activeRuns.get(runId)) break;

                            const pageData = await this.fetchDataForPage(asin, week, page, marketplace, baseDomain, pageSize);

                            if (pageData.reportsV2) {
                                let totalItems = 0;
                                pageData.reportsV2.forEach((report: any) => {
                                    totalItems = Math.max(totalItems, report.totalItems);
                                    if (report.rows) {
                                        report.rows.forEach((row: any) => {
                                            if (row["qp-asin-query"]) {
                                                queries.push(row["qp-asin-query"]);
                                            }
                                        });
                                    }
                                });

                                if (totalItems <= page * pageSize) {
                                    hasMorePages = false;
                                } else {
                                    page++;
                                    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between pages
                                }
                            } else {
                                hasMorePages = false;
                            }
                        }

                        console.log(`[SQP Universal] Found ${queries.length} queries for ASIN ${asin} Week ${week}`);

                        // 2. Fetch details for each query
                        let queryIndex = 0;
                        for (const query of queries) {
                            queryIndex++;
                            if (runId && !this.activeRuns.get(runId)) break;

                            // 1. Delay Phase (Wait first)
                            // Skip wait for first item? Or not? logic:
                            // Usually: Process Item 1. Wait. Process Item 2.
                            // But user wants "Waiting..." explicit.
                            // Current logic: wait BEFORE processing (lines 513-524 in original).
                            // So I will keep it BEFORE, but ensure status message is correct.
                            // And add Slow Mode.

                            const isFirst = queryIndex === 1;
                            let effectiveDelay = options.delay || 500;
                            if (options.slowMode) {
                                effectiveDelay = Math.max(effectiveDelay, 2000) + Math.random() * 2000;
                            }

                            if (!isFirst && effectiveDelay > 0) {
                                onProgress({
                                    total,
                                    completed,
                                    failed: errors.length,
                                    statusMessage: `Waiting ${Math.round(effectiveDelay / 100) / 10}s${options.slowMode ? ' (Slow Mode)' : ''}...`
                                });
                                await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                            }

                            // 2. Process with Retry
                            const maxRetries = options.autoRetry ? 3 : 1;
                            let attempt = 0;
                            let success = false;

                            while (attempt < maxRetries && !success) {
                                attempt++;
                                onProgress({
                                    total,
                                    completed,
                                    failed: errors.length,
                                    currentUrl: asin,
                                    statusMessage: attempt > 1 ? `Processing Query ${queryIndex}/${queries.length}: ${query} (Attempt ${attempt})...` : `Processing Query ${queryIndex}/${queries.length}: ${query}`
                                });

                                try {
                                    const detailsData = await this.fetchQueryDetails(asin, week, marketplace, query, baseDomain);

                                    if (detailsData.reportsV2) {
                                        detailsData.reportsV2.forEach((report: any) => {
                                            if (report.rows) {
                                                report.rows.forEach((row: any) => {
                                                    row.OriginASIN = asin;
                                                    row.Week = this.subtractDaysFromDate(week, -1);
                                                    row.Keyword = query;
                                                });
                                                allRowsData.push(...report.rows);
                                            }
                                        });
                                        success = true;
                                    } else {
                                        success = true;
                                    }
                                } catch (e: any) {
                                    console.error(`Error processing query "${query}" (Attempt ${attempt}):`, e);

                                    if (e.message && (e.message.includes('AUTH_FAILED') || e.message.includes('Session expired'))) {
                                        throw e; // Break retry loop
                                    }

                                    if (options.smartScrape && attempt < maxRetries) {
                                        const backoff = 2000 * Math.pow(2, attempt);
                                        onProgress({
                                            total,
                                            completed,
                                            failed: errors.length,
                                            currentUrl: asin,
                                            statusMessage: `Smart Scrape Error: ${e.message}. Retrying in ${backoff / 1000}s...`
                                        });
                                        await new Promise(resolve => setTimeout(resolve, backoff));
                                    }
                                }
                            }
                        }


                        completed++;
                    } catch (error: any) {
                        console.error(`[SQP Universal] Error processing ${asin} - ${week}:`, error);
                        errors.push(`${asin} (${week}): ${error instanceof Error ? error.message : String(error)}`);
                        completed++;

                        if (error.message && (error.message.includes('AUTH_FAILED') || error.message.includes('Session expired'))) {
                            onProgress({
                                total,
                                completed,
                                failed: errors.length,
                                statusMessage: `Stopped due to Auth Failure: ${error.message}`
                            });
                            if (runId) this.activeRuns.set(runId, false);
                            break mainLoop;
                        }
                    }
                }
                // Delay between ASINs
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return {
                results: allRowsData,
                errors,
                processedCount: completed,
                total: total,
                successful: completed - errors.length,
                failed: errors.length,
                startTime: Date.now()
            };
        } finally {
            if (runId) {
                this.activeRuns.delete(runId);
                this.runStates.delete(runId);
            }
        }
    }

    /**
     * Stop a running task
     */
    stop(runId: string) {
        this.activeRuns.set(runId, false);
    }
}

export const sqpUniversalService = new SQPUniversalService();

/**
 * Enrich SQP data with calculated metrics
 */
export const enrichSQPData = (rows: any[]): any[] => {
    return rows.map(row => {
        // Parse numbers from strings (handling potential "N/A" or "-")
        const parseNum = (val: any) => {
            if (!val || val === '-' || val === 'N/A') return 0;
            return parseFloat(String(val).replace(/[^0-9.-]/g, ''));
        };

        const impressions = parseNum(row['qp-asin-impressions']);
        const clicks = parseNum(row['qp-asin-clicks']);
        const cartAdds = parseNum(row['qp-asin-cart-adds']);
        const purchases = parseNum(row['qp-asin-purchases']);

        const impressionShare = parseNum(row['qp-asin-share-impressions']);
        const clickShare = parseNum(row['qp-asin-share-clicks']);

        const purchaseShare = parseNum(row['qp-asin-share-purchases']);

        // Calculate Metrics
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cvr = clicks > 0 ? (purchases / clicks) * 100 : 0;
        const cartAddRate = clicks > 0 ? (cartAdds / clicks) * 100 : 0;

        // Deltas (Performance vs Visibility)
        const clickShareDelta = clickShare - impressionShare; // > 0 means good title/image
        const conversionShareDelta = purchaseShare - clickShare; // > 0 means good listing/price

        return {
            ...row,
            // Add new metrics
            'ASIN CTR %': ctr.toFixed(2),
            'ASIN CVR %': cvr.toFixed(2),
            'Cart Add Rate %': cartAddRate.toFixed(2),
            'Click Share Delta': clickShareDelta.toFixed(2),
            'Conversion Share Delta': conversionShareDelta.toFixed(2),
            'Performance Score': (clickShareDelta + conversionShareDelta).toFixed(2)
        };
    });
};
