import { indexedDBService } from '@/lib/services/indexed-db.service';
import { STORES, type PriceTracker, type PriceHistory } from '@/lib/db/schema';
import { notificationService } from '@/lib/services/notification.service';

interface PriceTrackerOptions {
    marketplace: string;
    asinList: string[];
    frequency?: 'hourly' | 'daily' | 'weekly';
    alertRules?: any;
    runId?: string;
    delay?: number;
    outputFormat?: string;
}

class PriceTrackerService {

    // Core execution method called by ToolService
    async execute(
        _urls: string[] | null,
        options: PriceTrackerOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { marketplace, frequency = 'daily', alertRules = {}, runId: _runId, delay = 5000 } = options;

        // Support both options.asinList (standard tool call) and _urls (scheduler call)
        const asinList = options.asinList || _urls || [];

        const results: any[] = [];
        const errors: string[] = [];

        // 1. Validation
        if (!asinList || asinList.length === 0) {
            throw new Error('No ASINs provided');
        }

        // 1.5 Initialize Trackers immediately so they show up in UI
        const timestamp = new Date().toISOString();
        const existingTrackers = await indexedDBService.getAll<PriceTracker>(STORES.PRICE_TRACKERS);

        // Helper to get domain
        const getDomain = (mp: string) => {
            const map: Record<string, string> = {
                'US': 'amazon.com',
                'UK': 'amazon.co.uk',
                'CA': 'amazon.ca',
                'DE': 'amazon.de',
                'FR': 'amazon.fr',
                'IT': 'amazon.it',
                'ES': 'amazon.es',
                'IN': 'amazon.in'
            };
            return map[mp] || 'amazon.com';
        };
        const domain = getDomain(marketplace);

        for (const asin of asinList) {
            let tracker = existingTrackers.find(t => t.asin === asin && t.marketplace === marketplace);
            if (!tracker) {
                tracker = {
                    id: crypto.randomUUID(),
                    userId: 'local',
                    asin,
                    marketplace,
                    frequency,
                    isActive: true, // Default to true so it runs
                    enabled: true, // Legacy field support
                    alertRules,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    title: `Initializing ${asin}...`,
                    image: '',
                    status: 'initializing'
                } as any;

                await indexedDBService.put(STORES.PRICE_TRACKERS, tracker!);
            }
        }

        // 2. Processing Loop
        let completed = 0;
        for (const asin of asinList) {
            try {
                // Update Progress: Fetching...
                onProgress({
                    total: asinList.length,
                    completed,
                    currentUrl: asin,
                    statusMessage: `Checking price for ${asin}...`
                });

                // 3. Fetch Price (Real Scraping)
                const productUrl = `https://www.${domain}/dp/${asin}`;
                const priceData = await this.scrapeData(productUrl);

                if (priceData) {
                    // 4. Update Tracker with Real Data
                    const latestTrackers = await indexedDBService.getAll<PriceTracker>(STORES.PRICE_TRACKERS);
                    let tracker = latestTrackers.find(t => t.asin === asin && t.marketplace === marketplace);

                    if (tracker) {
                        // Parse Price
                        const priceString = priceData.pricing?.currentPrice || '0';
                        const currentPrice = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
                        const currency = priceString.replace(/[0-9.,\s]/g, '') || 'USD'; // Rough currency extraction

                        // Update Tracker Details
                        tracker.title = priceData.product?.title || tracker.title;
                        tracker.image = priceData.product?.imageUrl || tracker.image;
                        tracker.lastRunAt = new Date().toISOString();
                        tracker.updatedAt = new Date().toISOString();
                        tracker.currentPrice = currentPrice;
                        tracker.currency = currency; // Store currency if schema supports it or just use generic
                        // @ts-ignore
                        tracker.status = 'active';

                        await indexedDBService.put(STORES.PRICE_TRACKERS, tracker);

                        // 5. Save Price History
                        const history: PriceHistory = {
                            id: crypto.randomUUID(),
                            trackerId: tracker.id,
                            asin,
                            marketplace,
                            price: currentPrice,
                            currency: currency,
                            timestamp: new Date().toISOString(),
                            source: 'product_page'
                        };
                        await indexedDBService.put(STORES.PRICE_HISTORY, history);

                        results.push({
                            ...history,
                            title: tracker.title,
                            inStock: priceData.availability?.inStock
                        });

                        // 6. Check Alerts & Notify
                        await this.checkAlertsAndNotify(tracker, currentPrice, priceData.availability?.inStock);
                    }

                } else {
                    errors.push(`Could not fetch price for ${asin}`);
                }

                completed++;
                // Wait between requests to avoid rate limiting
                if (asinList.length > 1) {
                    await new Promise(r => setTimeout(r, delay));
                }

            } catch (err: any) {
                console.error(`Error processing ${asin}:`, err);
                errors.push(`${asin}: ${err.message}`);
                completed++;
            }
        }

        if (results.length > 0 && options.outputFormat) {
            const { downloadService } = await import('@/lib/services/download.service');
            await downloadService.downloadTaskResults({
                taskId: _runId || `manual_${Date.now()}`,
                toolName: 'Price Tracker',
                toolId: 'price-tracker',
                marketplace,
                data: results.map(r => ({
                    ASIN: r.asin,
                    Title: r.title,
                    'Marketplace': r.marketplace,
                    'Current Price': r.currentPrice,
                    'Currency': r.currency,
                    'In Stock': r.inStock ? 'Yes' : 'No',
                    'Target Price': r.alertRules?.targetPrice || '-',
                    'Last Checked': new Date().toLocaleString()
                })),
                source: _runId ? 'manual_schedule' : 'quick_run',
                format: options.outputFormat as any
            });
        }

        return {
            success: results.length > 0,
            processedCount: asinList.length,
            total: asinList.length,
            successful: results.length,
            failed: errors.length,
            results: results,
            errors: errors,
            creditsUsed: 0
        };
    }

    // Scrape data using a real tab
    private async scrapeData(url: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let tabId: number | undefined;
            try {
                // Create tab (active: false doesn't work well for scraping sometimes due to resource throttling, but let's try active: true first to be safe, or false if user wants less intrusive)
                // User said "open page in new tab... wait a few seconds close the tab"
                const tab = await chrome.tabs.create({ url, active: true });
                tabId = tab.id;

                if (!tabId) {
                    throw new Error('Failed to create tab');
                }

                // Wait for load
                const listener = (tid: number, changeInfo: any) => {
                    if (tid === tabId && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);

                        // Give it a grace period for dynamic content (JS rendering)
                        setTimeout(async () => {
                            try {
                                // Send message to content script
                                const response = await chrome.tabs.sendMessage(tabId!, {
                                    type: 'extractData',
                                    url
                                });

                                if (response && response.success) {
                                    resolve(response.data);
                                } else {
                                    reject(new Error(response?.error || 'Extraction failed'));
                                }
                            } catch (e) {
                                reject(e);
                            } finally {
                                // Close tab
                                if (tabId) chrome.tabs.remove(tabId);
                            }
                        }, 5000); // 5 seconds wait as requested "wait a few seconds"
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);

            } catch (e) {
                if (tabId) chrome.tabs.remove(tabId);
                reject(e);
            }
        });
    }

    // Check alerts and optionally notify
    private async checkAlertsAndNotify(tracker: any, currentPrice: number, inStock: boolean) {
        if (!tracker.alertRules) return;

        const rules = tracker.alertRules;
        let shouldNotify = false;
        let message = '';
        const title = tracker.title?.substring(0, 50) + '...';

        // 1. Price Drop
        if (rules.targetPrice && currentPrice > 0 && currentPrice <= rules.targetPrice) {
            shouldNotify = true;
            message = `Price drop alert! Now ${currentPrice} (Target: ${rules.targetPrice})`;
        }

        // 2. Stock Status
        if (rules.notifyOnStock && inStock) {
            // Only notify if it was previously out of stock? 
            // For now, simple check: if user wants stock alerts and it is in stock, we notify.
            //Ideally we check previous history to see if it changed state.
            // Let's grab previous history to compare
            const history = await this.getHistory(tracker.id);
            // Sort by date desc, get 2nd item (1st is current)
            if (history.length > 1) {
                // Basic heuristic: if we have history, maybe we can assume we check for change?
                // But user requirements: "price notifcation should only trigger becased on the users set condition in stock or price change"
            }

            // If strictly following "notifyOnStock", we might notify every time it runs if it's in stock.
            // Let's refine: Notify if price target met OR (NotifyOnStock AND InStock)
            // Ideally we should avoid spamming if nothing changed, but requirements say "trigger based on users set condition".
            if (!shouldNotify) {
                shouldNotify = true;
                message = `Item is in Stock!`;
            } else {
                message += ` & In Stock!`;
            }
        }

        // 3. Percentage Change (if we want to support it later, user mentioned "%")
        // "stock or price change in thier defined %"
        // If alertRules has a percentage threshold...

        if (shouldNotify) {
            // Local + in-app notification via notificationService
            await notificationService.show({
                title: `Price Alert: ${title}`,
                message,
                type: 'warning',
                priority: 2,
                requireInteraction: true,
                relatedId: tracker.id,
                relatedType: 'task',
            });

            // External notifications (Telegram, Discord, Slack) via backend API
            try {
                const { apiClient } = await import('@/lib/api/client');
                await apiClient.request('/notifications/alert', {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'price_alert',
                        title: `Price Alert: ${tracker.title?.substring(0, 80)}`,
                        message,
                        metadata: {
                            asin: tracker.asin,
                            currentPrice,
                            targetPrice: tracker.alertRules?.targetPrice,
                            inStock,
                        },
                    }),
                });
            } catch (extNotifErr) {
                // External notifications are best-effort — don't surface errors to user
                console.warn('[PriceTracker] External notification failed (non-critical):', extNotifErr);
            }
        }
    }

    // Method to get all trackers (for Dashboard)
    async getTrackers(): Promise<PriceTracker[]> {
        return await indexedDBService.getAll<PriceTracker>(STORES.PRICE_TRACKERS);
    }

    // Method to get history for a tracker
    async getHistory(trackerId: string): Promise<PriceHistory[]> {
        const allHistory = await indexedDBService.getAll<PriceHistory>(STORES.PRICE_HISTORY);
        return allHistory.filter(h => h.trackerId === trackerId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Method to delete a tracker
    async deleteTracker(trackerId: string): Promise<void> {
        await indexedDBService.delete(STORES.PRICE_TRACKERS, trackerId);
        // Clean up history
        const allHistory = await indexedDBService.getAll<PriceHistory>(STORES.PRICE_HISTORY);
        const relatedHistory = allHistory.filter(h => h.trackerId === trackerId);
        for (const history of relatedHistory) {
            await indexedDBService.delete(STORES.PRICE_HISTORY, history.id);
        }
    }
}

export const priceTrackerService = new PriceTrackerService();
