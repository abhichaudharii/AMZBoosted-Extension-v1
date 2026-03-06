import { TaskLogger } from '@/lib/services/logging.service';
import { ToolExecutionProgress } from '@/lib/types/tool-execution';
import { toolDataService } from './tool-data.service';

export class ToolBrowserService {

    /**
     * Process URLs for a specific tool
     * This dispatches to the appropriate tool processor
     */
    async processUrls(
        toolId: string,
        urls: string[],
        marketplace: string,
        options: Record<string, any> = {},
        logger: TaskLogger,
        onProgress?: (progress: ToolExecutionProgress) => void
    ): Promise<{ data: any[]; errors: string[] }> {
        const results: any[] = [];
        const errors: string[] = [];
        let completed = 0;

        logger.info(`Starting URL processing`, { totalUrls: urls.length });

        for (const url of urls) {
            try {
                onProgress?.({
                    total: urls.length,
                    completed,
                    failed: errors.length,
                    currentUrl: url,
                });

                logger.info(`Processing URL ${completed + 1}/${urls.length}`, { url });

                // Extract data from the page via content script
                const result = await this.extractDataFromUrl(url, toolId, { ...options, marketplace });

                if (result.success) {
                    results.push(result.data);
                    logger.info(`Successfully processed URL ${completed + 1}/${urls.length}`, { url });
                } else {
                    errors.push(`${url}: ${result.error}`);
                    logger.warn(`Failed to process URL ${completed + 1}/${urls.length}`, {
                        url,
                        error: result.error,
                    });
                }

                completed++;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${url}: ${errorMsg}`);
                logger.error(`Error processing URL ${completed + 1}/${urls.length}`, {
                    url,
                    error: errorMsg,
                });
                completed++;
            }

            // Small delay between requests to avoid rate limiting
            await toolDataService.delay(500);
        }

        onProgress?.({
            total: urls.length,
            completed,
            failed: errors.length,
        });

        logger.info('URL processing completed', {
            total: urls.length,
            successful: results.length,
            failed: errors.length,
        });

        return { data: results, errors };
    }

    /**
     * Extract data from a URL using content script
     */
    async extractDataFromUrl(
        url: string,
        toolId: string,
        options: Record<string, any>
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Find or create tab with the URL
            const tab = await this.findOrCreateTab(url);

            // Wait for tab to load completely
            await this.waitForTabLoad(tab.id!);

            // Wait for content script to be ready (with retry logic)
            const isReady = await this.waitForContentScript(tab.id!);

            if (!isReady) {
                return {
                    success: false,
                    error: 'Content script failed to load',
                };
            }

            // Send extract message to content script
            const response = await chrome.tabs.sendMessage(tab.id!, {
                type: 'extractData',
                url,
                toolId,
                options,
            });

            // Close the tab after extraction
            try {
                await chrome.tabs.remove(tab.id!);
            } catch (e) {
                // Tab might be already closed
            }

            return response;
        } catch (error) {
            console.error('[Tool] Failed to extract data:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Extraction failed',
            };
        }
    }

    /**
     * Wait for tab to finish loading
     */
    private async waitForTabLoad(tabId: number): Promise<void> {
        return new Promise((resolve) => {
            const checkStatus = async () => {
                try {
                    const tab = await chrome.tabs.get(tabId);
                    if (tab.status === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkStatus, 100);
                    }
                } catch (error) {
                    resolve(); // Tab might be closed
                }
            };
            checkStatus();
        });
    }

    /**
     * Wait for content script to be ready
     */
    private async waitForContentScript(tabId: number, maxRetries = 30): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try to ping the content script
                await chrome.tabs.sendMessage(tabId, { type: 'ping' });
                return true; // Content script is ready
            } catch (error) {
                // Content script not ready yet, wait and retry
                await toolDataService.delay(500);
            }
        }
        return false; // Timed out
    }

    /**
     * Find existing tab with URL or create new one
     */
    private async findOrCreateTab(url: string): Promise<chrome.tabs.Tab> {
        // Normalize URL - add protocol if missing
        const normalizedUrl = this.normalizeUrl(url);

        // Don't try to find existing tabs - just create a new one
        // This avoids URL pattern matching issues with chrome.tabs.query
        const tab = await chrome.tabs.create({ url: normalizedUrl, active: false });
        // Don't focus the tab to avoid interrupting user
        // Note: 'active: false' only works if we're not waiting for it to be active?
        // Actually active:false means open in background.

        return tab;
    }

    /**
     * Normalize URL by adding protocol if missing
     */
    normalizeUrl(url: string): string {
        // Remove any leading/trailing whitespace
        url = url.trim();

        // If URL already has protocol, return as is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Add https:// by default
        return `https://${url}`;
    }
}

export const toolBrowserService = new ToolBrowserService();
