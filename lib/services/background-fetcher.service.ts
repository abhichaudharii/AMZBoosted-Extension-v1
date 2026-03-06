import { apiClient } from '@/lib/api/client';

/**
 * Service to fetch data in the background periodically.
 * This ensures that the local cache is kept up-to-date without
 * requiring the user to refresh the page.
 */
class BackgroundFetcherService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly INTERVAL = 60 * 1000; // 1 minute

    /**
     * Initialize the background fetcher
     */
    /**
     * Initialize the background fetcher
     */
    initialize() {
        if (this.intervalId) return;

        console.log('[BackgroundFetcher] Initializing...');

        // Initial fetch
        this.fetchAll();

        // Start interval
        this.startPolling();

        // Listen for visibility changes to pause/resume polling
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stop();
                    console.log('[BackgroundFetcher] Tab hidden, paused polling');
                } else {
                    this.startPolling();
                    console.log('[BackgroundFetcher] Tab visible, resumed polling');
                    // Immediate refresh on visible if needed
                    this.fetchAll();
                }
            });
        }
    }

    private startPolling() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            this.fetchAll();
        }, this.INTERVAL);
    }

    /**
     * Fetch all data types
     */
    private async fetchAll() {
        console.log('[BackgroundFetcher] Fetching data...');
        try {
            // Credits: Force refresh every minute to keep dashboard updated
            // This matches the user's request for frequent dashboard updates
            await apiClient.getCredits(true);

            // Usage Stats: Force refresh every minute
            await apiClient.getUsageStats(true);

            // Limits: Respect TTL (24h)
            // This matches "billing page will change once a month"
            await apiClient.getLimits(false);

            // User Profile: Respect TTL (1h)
            // This matches "profile details ... doesnt change every time"
            await apiClient.getUser(false);

            // Settings: Respect TTL (1h)
            await apiClient.getUserSettings(false);

            // Subscription: Respect TTL (1h)
            await apiClient.getSubscriptionStatus(false);

            // Plans: Respect TTL (1h)
            await apiClient.getPlans(false);

            // Tools: Respect TTL (1h)
            await apiClient.getTools(false);

            // Integrations: Cached in local storage, fetch if missing
            await apiClient.getAvailableIntegrations(false);

        } catch (error) {
            console.error('[BackgroundFetcher] Error fetching data:', error);
        }
    }

    /**
     * Stop the background fetcher
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const backgroundFetcherService = new BackgroundFetcherService();
