import { apiClient } from '@/lib/api/client';
import { authService } from './auth.service';

class SyncService {
    private intervalId: NodeJS.Timeout | null = null;

    async init() {
        this.startPolling();
    }

    startPolling() {
        // Consolidated into BackgroundFetcherService to prevent request spam
        // if (this.intervalId) return;
        // this.refreshAll(); // Immediate check
        // this.intervalId = setInterval(() => this.refreshAll(), this.POLLING_INTERVAL);
        // console.log(`[SyncService] Started polling every ${this.POLLING_INTERVAL / 1000} seconds`);
        console.log('[SyncService] Polling delegated to BackgroundFetcherService');
    }

    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[SyncService] Stopped polling');
        }
    }

    /**
     * Blindly refresh all critical data
     * Relies on API Client's caching if needed, but we pass forceRefresh=true 
     * in the loop to ensure we get Fresh data if the TTL has expired (which it aligns with).
     * Actually, if we want strict 1-minute updates, we can just rely on the TTLs we set in client.ts
     * and blindly call the getters. But passing forceRefresh=true makes it explicit 
     * that this service's job is to FETCH NEW DATA.
     */
    async refreshAll() {
        try {
            console.log('[SyncService] Refreshing all data...');

            // Execute refreshes in parallel where possible, but user auth is central
            await authService.refreshUserData(); // Handles user, credits, limits

            // Refresh other global data
            await Promise.all([
                apiClient.getPlans(true),
                apiClient.getTools(true),
                apiClient.getSubscriptionStatus(true),
                apiClient.getUsageStats(true),
                apiClient.getIntegrations() // Integrations might need a force refresh param added later if needed
            ]);

            console.log('[SyncService] All data refreshed');
        } catch (error) {
            console.error('[SyncService] Refresh failed:', error);
        }
    }
}

export const syncService = new SyncService();
