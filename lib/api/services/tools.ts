import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const ToolsService = {
    async getTools(client: IAPIClient, forceRefresh = false): Promise<any[] | null> {
        if (!forceRefresh) {
            const cachedTools = await secureStorage.get('toolsConfig');
            const cachedTs = await secureStorage.get('toolsConfigTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedTools.toolsConfig && cachedTs.toolsConfigTimestamp && (now - cachedTs.toolsConfigTimestamp < 60 * 1000)) {
                return cachedTools.toolsConfig;
            }
        }

        const result = await client.request<any[]>('/tools');
        if (result.success && result.data) {
            await secureStorage.set({
                toolsConfig: result.data,
                toolsConfigTimestamp: Date.now()
            });
            return result.data;
        }
        return null;
    }
};
