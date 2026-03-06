import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const IntegrationsService = {
    async getIntegrations(client: IAPIClient): Promise<{ integrations: any[] } | null> {
        // Try to get from local storage first
        const localData = await secureStorage.get('integrations');
        if (localData.integrations) {
            return { integrations: localData.integrations };
        }

        // If not in storage, try API
        try {
            const result = await client.request<{ integrations: any[] }>('/integrations/available');
            if (result.success && result.data) {
                await secureStorage.set({ integrations: result.data.integrations });
                return result.data;
            }
        } catch (e) {
            console.warn('[API] Failed to fetch integrations from backend, using empty list');
        }

        return { integrations: [] };
    },

    async syncIntegration(client: IAPIClient, id: string): Promise<boolean> {
        try {
            // 1. Call API
            await client.request('/integrations/sync', {
                method: 'POST',
                body: JSON.stringify({ id }),
            });

            // Update timestamp in local storage
            const current = await IntegrationsService.getIntegrations(client);
            const integrations = current?.integrations || [];

            const updatedIntegrations = integrations.map((i: any) =>
                i.id === id ? { ...i, lastSyncedAt: new Date().toISOString() } : i
            );

            await secureStorage.set({ integrations: updatedIntegrations });
            return true;
        } catch (error) {
            console.error('[API] Failed to sync integration:', error);
            return false;
        }
    },

    async getAvailableIntegrations(client: IAPIClient, forceRefresh = false): Promise<any[]> {
        if (!forceRefresh) {
            const cached = await secureStorage.get('availableIntegrations');
            // 1 hour TTL for available list
            if (cached.availableIntegrations && cached.availableIntegrationsTimestamp && (Date.now() - cached.availableIntegrationsTimestamp < 60 * 60 * 1000)) {
                return cached.availableIntegrations;
            }
        }

        const result = await client.request<any>('/integrations/available'); // Type as any to handle nested check

        if (result.success && result.data) {
            // Handle nested data response: { data: { data: [...] } }
            // The request method returns the body.data as result.data
            // If the API returns { data: [ ... ] }, then result.data is [ ... ], but user report shows nested.
            // Let's be defensive.
            let integrations = [];

            if (Array.isArray(result.data)) {
                integrations = result.data;
            } else if (result.data.data && Array.isArray(result.data.data)) {
                integrations = result.data.data;
            }

            await secureStorage.set({
                availableIntegrations: integrations,
                availableIntegrationsTimestamp: Date.now()
            });
            return integrations;
        }

        return [];
    },

    async connectIntegration(client: IAPIClient, data: {
        definition_id: string;
        credentials?: any;
        settings?: any;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        const result = await client.request<any>('/integrations/connect', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success) {
            await IntegrationsService.getAvailableIntegrations(client, true); // Refresh cache
            return { success: true, data: result.data };
        }

        return { success: false, error: result.error };
    },

    async disconnectIntegration(client: IAPIClient, definitionId: string): Promise<boolean> {
        const result = await client.request(`/integrations/connect?definition_id=${definitionId}`, {
            method: 'DELETE',
        });

        if (result.success) {
            await IntegrationsService.getAvailableIntegrations(client, true); // Refresh cache
            return true;
        }
        return false;
    },

    async configureNotificationChannel(client: IAPIClient, data: {
        definition_id: string;
        config: any;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        const result = await client.request<any>('/integrations/connect', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success) {
            await IntegrationsService.getAvailableIntegrations(client, true); // Refresh cache
            return { success: true, data: result.data };
        }

        return { success: false, error: result.error };
    },

    async verifyConnection(client: IAPIClient, data: { type: string; config: any }): Promise<{ success: boolean; error?: string }> {
        const result = await client.request<any>('/integrations/test', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return { success: result.success, error: result.error };
    }
};
