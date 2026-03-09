import { apiClient } from '@/lib/api/client';
import { authService } from './auth.service';

/**
 * Service to fetch data in the background periodically.
 * Integrated with TanStack Query for reactive UI updates.
 */
class BackgroundFetcherService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly INTERVAL = 60 * 1000; // 1 minute
    private queryClient: any = null;

    /**
     * Initialize the background fetcher
     * @param queryClient - TanStack Query Client instance
     */
    initialize(queryClient?: any) {
        if (this.intervalId) return;
        if (queryClient) this.queryClient = queryClient;

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
     * Fetch all data types and sync with TanStack Query
     */
    private async fetchAll() {
        // Guard: Only fetch if authenticated
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
            if (this.intervalId) {
                console.log('[BackgroundFetcher] User not authenticated, pausing polling');
                this.stop();
            }
            return;
        }

        console.log('[BackgroundFetcher] Synchronizing data...');
        try {
            // If queryClient is available, we invalidate queries to trigger background refetch
            // This ensures all UI components using useQuery hooks are updated.
            if (this.queryClient) {
                // High priority updates
                await Promise.all([
                    this.queryClient.invalidateQueries({ queryKey: ['credits'] }),
                    this.queryClient.invalidateQueries({ queryKey: ['usage'] })
                ]);

                // Lower priority background prefetches
                this.queryClient.prefetchQuery({ queryKey: ['user'], queryFn: () => apiClient.getUser() });
                this.queryClient.prefetchQuery({ queryKey: ['limits'], queryFn: () => apiClient.getLimits() });
            } else {
                // Fallback to direct API calls if queryClient isn't initialized yet
                await Promise.all([
                    apiClient.getCredits(),
                    apiClient.getUsageStats(),
                    apiClient.getLimits(),
                    apiClient.getUser()
                ]);
            }
        } catch (error) {
            console.error('[BackgroundFetcher] Sync error:', error);
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
