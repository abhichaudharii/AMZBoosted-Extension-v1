import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const SettingsService = {
    async getUserSettings(client: IAPIClient, forceRefresh = false): Promise<{ settings: any } | null> {
        if (!forceRefresh) {
            const cached = await secureStorage.get(['userSettings', 'userSettingsTimestamp']);
            const now = Date.now();
            // 1 hour TTL
            if (cached.userSettings && cached.userSettingsTimestamp && (now - cached.userSettingsTimestamp < 60 * 60 * 1000)) {
                return { settings: cached.userSettings };
            }
        }

        const result = await client.request<{ settings: any }>('/settings');

        if (result.success && result.data) {
            // Cache settings locally for offline access
            await secureStorage.set({
                userSettings: result.data.settings,
                userSettingsTimestamp: Date.now()
            });
            return result.data;
        }

        return null;
    }
};
