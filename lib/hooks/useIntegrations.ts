import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secure-storage';
import { toast } from 'sonner';

export interface IntegrationDefinition {
    id: string;
    name: string;
    key: string;
    category: 'integration' | 'notification_channel';
    min_plan_tier: string;
    logo_url?: string;
    created_at: string;
    is_locked: boolean;
    is_connected: boolean;
    user_tier?: string;
    connected_at?: string;
}

export function useIntegrations() {
    const [integrations, setIntegrations] = useState<IntegrationDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadIntegrations = useCallback(async (force = false) => {
        try {
            setLoading(true);
            setError(null);

            // Try cache first if not forced
            if (!force) {
                const cached = await secureStorage.get('availableIntegrations');
                if (cached.availableIntegrations) {
                    setIntegrations(cached.availableIntegrations);
                    setLoading(false);
                    // continue to fetch fresh data if needed, or return early? 
                    // Let's rely on background sync mostly, but initial load should be fast.
                    // Ideally we fetch fresh in background if cache is old, but useFeatures logic is simpler.
                    // We'll trust the client's internal caching for now.
                }
            }

            const data = await apiClient.getAvailableIntegrations(force);
            setIntegrations(data);
        } catch (err) {
            console.error('Failed to load integrations:', err);
            setError('Failed to load integrations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadIntegrations();

        // Optional: Listen for background updates if we implement an event bus
        // For now, rely on manual refresh actions or periodic re-renders
    }, [loadIntegrations]);

    const connectIntegration = async (definitionId: string, credentials?: any, settings?: any) => {
        try {
            const result = await apiClient.connectIntegration({ definition_id: definitionId, credentials, settings });
            if (result.success) {
                toast.success('Integration connected successfully');
                await loadIntegrations(true); // Refresh state
                return true;
            } else {
                toast.error(result.error || 'Failed to connect integration');
                return false;
            }
        } catch (e: any) {
            toast.error(e.message || 'Connection failed');
            return false;
        }
    };

    const disconnectIntegration = async (definitionId: string) => {
        try {
            const success = await apiClient.disconnectIntegration(definitionId);
            if (success) {
                toast.success('Integration disconnected');
                await loadIntegrations(true);
                return true;
            } else {
                toast.error('Failed to disconnect');
                return false;
            }
        } catch (e) {
            toast.error('Disconnect failed');
            return false;
        }
    };

    const configureChannel = async (definitionId: string, config: any) => {
        try {
            const result = await apiClient.configureNotificationChannel({ definition_id: definitionId, config });
            if (result.success) {
                toast.success('Channel configured successfully');
                await loadIntegrations(true);
                return true;
            } else {
                toast.error(result.error || 'Failed to configure channel');
                return false;
            }
        } catch (e: any) {
            toast.error(e.message || 'Configuration failed');
            return false;
        }
    };

    return {
        integrations,
        loading,
        error,
        refresh: () => loadIntegrations(true),
        connectIntegration,
        disconnectIntegration,
        configureChannel
    };
}
